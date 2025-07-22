const express = require('express');
const path = require('path');
const sensor = require('./src/sensor');
// const video = require('./src/video');

// const cors = require('cors'); // REMOVER QUANDO ESTIVER PRONTO PARA PRODUÇÃO
// DAR O NPM UNINSTALL TAMBÉM QUANDO TIVER PRONTO PARA PRODUÇÃO

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON and serve static files
app.use(express.json({ limit: '2500mb' }));
app.use(express.static(path.join(__dirname, 'public')));

//app.use(cors()); // REMOVER QUANDO ESTIVER PRONTO PARA PRODUÇÃO

// Endpoint to read sensor data
/*
body example:
{
  "filepath": "20250415150255.tsv",
  "colsToDrop": ["DeviceName", "Version()", "Battery level(%)"],
  "config": {
    "groupMethod": "seconds_passed",
  }
}
*/
app.post('/api/sensor-data', async (req, res) => {
  const filepath = './public/data/'+req.body.filepath;
  const colsToDrop = req.body.colsToDrop || [];
  const config = req.body.config || {};

  try {
    const data = await sensor.readData(filepath, colsToDrop, config);
    res.json(data);
  } catch (error) {
    console.error('Error reading sensor data:', error);
    res.status(500).send('Error processing sensor data');
  }

});



app.post('/api/cut-data', async (req, res) => {
  const { data, start, end } = req.body;
  try {
    const cutData = await sensor.cutData(data, start, end);
    //const currentTimeString = formatTimestamp(Date.now());
    //sensor.saveTSV(cutData, './public/data/'+sensorFileName.split('.')[0]+'_cortado_'+currentTimeString+'.tsv');
    res.json(cutData);
  } catch (error) {
    console.error('Error cutting data:', error);
    res.status(500).send('Error cutting data');
  }
});

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);

  const pad = (n) => n.toString().padStart(2, '0');

  const dia = pad(date.getDate());
  const mes = pad(date.getMonth() + 1);
  const ano = date.getFullYear();
  const hora = pad(date.getHours());
  const minuto = pad(date.getMinutes());
  const segundo = pad(date.getSeconds());

  return `${dia}_${mes}_${ano}_${hora}h_${minuto}m_${segundo}s`;
}

app.post('/api/save-data', async (req, res) => {
  const { data, filename } = req.body;
  const currentTimeString = formatTimestamp(Date.now());
  const filepath = './public/data/'+filename+'_cortado_'+currentTimeString+'.tsv'
  const success = await sensor.saveTSV(data, filepath);
  if (success) {
    res.json({ message: 'Salvo em '+filepath });
    console.log('Dados salvos em:', filepath);
  } else {
    res.status(500).send('Erro ao salvar dados.');
  }
});

//app.post('/api/cut-video', async (req, res) => {
//  const { filepath, start, end } = req.body;
//  try {
//    const cutVideoPath = await video.cutVideo(filepath, start, end, "E:/Programas/ExpressWit/frontend/public/output.mp4");
//    console.log('Cut video path:', cutVideoPath);
//    res.json({ cutVideoPath });
//  } catch (error) {
//    console.error('Error cutting data:', error);
//    res.status(500).send('Error cutting data');
//  }
//});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
