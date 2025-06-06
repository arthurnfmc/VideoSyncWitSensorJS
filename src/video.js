const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

/**
 * Corta um vídeo entre dois tempos e salva o resultado.
 * 
 * @param {string} inputPath - Caminho para o vídeo original.
 * @param {number} startTime - Tempo de início em segundos.
 * @param {number} endTime - Tempo de fim em segundos.
 * @param {string} [outputPath] - (Opcional) Caminho para salvar o vídeo cortado.
 * 
 * @returns {Promise<string>} - Caminho do vídeo cortado.
 */
function cutVideo(inputPath, startTime, endTime, outputPath) {
  return new Promise((resolve, reject) => {
    const duration = endTime - startTime;

    if (duration <= 0) {
      return reject(new Error('A duração deve ser maior que zero.'));
    }

    //const ext = path.extname(inputPath);
    const filepath = "E:/Programas/ExpressWit/frontend/public/"+inputPath;
    const output = outputPath || `${baseName}_cut${ext}`;

    ffmpeg(filepath)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(output)
      .on('end', () => {
        console.log(`Vídeo cortado salvo em: ${output}`);
        resolve(path.basename(output));
      })
      .on('error', (err) => {
        console.error('Erro ao cortar vídeo:', err);
        reject(err);
      })
      .run();
  });
}

//cutVideo('../public/data/video_teste.mp4', 3, 4)
//  .then(outputPath => {
//    console.log('Vídeo cortado com sucesso:', outputPath);
//  })
//  .catch(error => {
//    console.error('Erro:', error.message);
//  });

module.exports = {cutVideo};