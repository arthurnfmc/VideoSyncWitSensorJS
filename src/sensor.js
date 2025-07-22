const fs = require('fs');
const d3 = require('d3-dsv');
const dayjs = require('dayjs');
const _ = require('lodash');

// Lê arquivo TSV (similar ao read_txt)
function readTSV(fpath) {
  const raw = fs.readFileSync(fpath, 'utf-8');
  return d3.tsvParse(raw);
}

// Remove colunas (similar ao clean_data)
function dropColumns(data, colsToDrop) {
  return data.map(row => {
    const newRow = { ...row };
    colsToDrop.forEach(col => delete newRow[col]);
    return newRow;
  });
}

// Corrige milliseconds (ex: "2024-06-05 14:33:12:9" -> "2024-06-05 14:33:12:009")
function fixMilliseconds(timeStr) {
  const parts = timeStr.split(':');
  if (parts.length >= 4) {
    const ms = parts.pop().padStart(3, '0');
    return [...parts, ms].join(':');
  }
  return timeStr;
}

// Converte string para time e gera seconds_passed
function processTimestamps(data) {
  data.forEach((row, idx) => {
    row.time = fixMilliseconds(row.time);
    row.time = dayjs(row.time, 'YYYY-MM-DD HH:mm:ss:SSS');
  });

  const initial = data[0].time;
  data.forEach(row => {
    row.seconds_passed = row.time.diff(initial, 'millisecond') / 1000;
  });

  return data;
}

// Interpola valores numéricos para uma nova base temporal
function interpolateToCameraFreq(data, cameraFreq) {
  const start = data[0].seconds_passed;
  const end = data[data.length - 1].seconds_passed;
  const numFrames = Math.floor((end - start) * cameraFreq) + 1;
  const newTimeBase = Array.from({ length: numFrames }, (_, i) => ({
    seconds_passed: start + i / cameraFreq
  }));

  const numericKeys = Object.keys(data[0]).filter(k =>
    k !== 'seconds_passed' && typeof data[0][k] === 'string' && !isNaN(parseFloat(data[0][k]))
  );

  numericKeys.forEach(k => {
    data.forEach(row => {
      row[k] = parseFloat(row[k]);
    });
  });

  // Interpolação linear simples
  const interp = newTimeBase.map(({ seconds_passed }) => {
    const i = _.sortedIndexBy(data, { seconds_passed }, 'seconds_passed');

    const before = data[i - 1] || data[0];
    const after = data[i] || data[data.length - 1];

    const ratio = (seconds_passed - before.seconds_passed) /
                  (after.seconds_passed - before.seconds_passed || 1);

    const row = { seconds_passed };
    numericKeys.forEach(k => {
      row[k] = before[k] + ratio * (after[k] - before[k]);
    });

    return row;
  });

  return interp;
}

// Agrupamento
function groupData(data, method, groupN = 4) {
  if (!method || method === 'NbyN') {
    return _.chunk(data, groupN).map(group => {
      const avg = {};
      Object.keys(group[0]).forEach(key => {
        const values = group.map(row => row[key]);
        if (values.every(v => !isNaN(parseFloat(v)))) {
          avg[key] = parseFloat(_.meanBy(group, r => parseFloat(r[key])));
        } else {
          avg[key] = values[0];
        }
      });
      return avg;
    });
  }

  if (method === 'seconds_passed') {
    const grouped = _.groupBy(data, row => row.seconds_passed);
    const result = [];

    for (const key in grouped) {
      const group = grouped[key];
      const row = {};

      Object.keys(group[0]).forEach(col => {
        const values = group.map(r => r[col]);
        if (values.every(v => !isNaN(parseFloat(v)))) {
          const meanVal = _.meanBy(group, r => parseFloat(r[col]));
          row[col] = parseFloat(meanVal);
        } else {
          row[col] = values[0];
        }
      });

      result.push(row);
    }

    return result;
  }

  if (method === 'noGroup') return data;

  throw new Error('Método de agrupamento inválido!');
}

// Função para ler dados
async function readData(fpath, colsToDrop = [], config = {}) {
  let df = readTSV(fpath);
  if (colsToDrop.length) df = dropColumns(df, colsToDrop);
  df = processTimestamps(df);

  if (config.camera_freq) {
    df = interpolateToCameraFreq(df, config.camera_freq);
  } else {
    df = groupData(df, config.groupMethod, config.groupN);
  }

  // Dropando time pois ja tem-se seconds_passed
  //df = dropColumns(df, ['time']);

  return df;
}

async function cutData(df, start, end) {
  df = df.filter(row => row.seconds_passed >= start && row.seconds_passed <= end);
  const minValue = Math.min(...df.map(row => row.seconds_passed));
  df.forEach(row => {
    row.seconds_passed -= minValue; // Normalizando para começar do zero
  });
  return df;
}

// Salva um DataFrame em formato TSV
async function saveTSV(df, fpath) {
  try {
    const tsvContent = d3.tsvFormat(df);
    await fs.promises.writeFile(fpath, tsvContent, 'utf-8');
    return true;
  } catch (error) {
    console.error('Erro ao salvar TSV:', error);
    return false;
  }
}
// Exemplo de uso:
//readData("../public/data/20250415150255.tsv", ['DeviceName', 'Version()', 'Battery level(%)'], {
//  groupMethod: 'seconds_passed', // 'NbyN', 'seconds_passed', 'noGroup'
//  groupN: 4
//}).then(df => {
//  console.log('DataFrame Processado:');
//  console.table(df[0]);
//}).catch(err => {
//  console.error("Erro ao processar dados:", err);
//});

module.exports = { readData, cutData, saveTSV };