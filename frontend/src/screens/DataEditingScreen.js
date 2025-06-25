import './DataEditingScreen.css';
import { useState, useEffect } from 'react';
import D3SensorChart from '../components/D3SensorChart';
import Loading from '../components/Loading';

function DataEditingScreen({sensorFileName, videoFileName, setProcessedData, setProcessedVideoStartAndEnd, advance}) {
  const [videoStart, setVideoStart] = useState(0);
  const [videoEnd, setVideoEnd] = useState(0);
  const [sensorData, setSensorData] = useState(0);
  const [sensorStart, setSensorStart] = useState(0);
  const [sensorEnd, setSensorEnd] = useState(0);
  const [editingSensor, setEditingSensor] = useState(false);
  const [autoCalculateSensorEnd, setAutoCalculateSensorEnd] = useState(true);
  
  // Get sensor data
  useEffect(() => {
    fetch('/api/sensor-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filepath: sensorFileName,
        colsToDrop: ["DeviceName", "Version()", "Battery level(%)"],
        config: {
          groupMethod: "NbyN",
          groupN: 4
        }
      }),
    })
    .then(response => response.json())
    .then(data => {
      setSensorData(data);
    })
    .catch(error => {
      console.error('Error fetching sensor data:', error);
    });
  }, [sensorFileName]);

  // Get the video size
  useEffect(() => {
    const vid = document.getElementById('video-player');
    vid.addEventListener('loadedmetadata', function() {
      setVideoEnd(Math.round(parseFloat(vid.duration)*100)/100);
    }); 
  }, []);

  // Set video time function
  const setVideoTime = (setFunc) => {
    const vid = document.getElementById('video-player');
    setFunc(Math.round(parseFloat(vid.currentTime)*100)/100);
  };

  const handleChangeStart = (e) => {
    const floatVal = parseFloat(e.target.value);
    setSensorStart(isNaN(floatVal) ? 0.0 : floatVal);
  };

  const handleChangeEnd = (e) => {
    const floatVal = parseFloat(e.target.value);
    setSensorEnd(isNaN(floatVal) ? 0.0 : floatVal);
  };

  const handleAdvance = () => {
    // Validacao de inputs
    if (autoCalculateSensorEnd && sensorStart + (videoEnd - videoStart) > sensorData[sensorData.length - 1]['seconds_passed']) {
      alert("O fim do sensor calculado ultrapassa o último dado do sensor.");
      return;
    }
    if (!autoCalculateSensorEnd && sensorEnd > sensorData[sensorData.length - 1]['seconds_passed']) {
      alert("O fim do sensor ultrapassa o último dado do sensor.");
      return
    }
    if (videoStart >= videoEnd) {
      alert("O momento inicial do vídeo deve ser menor que o momento final.");
      return;
    }
    if (sensorStart >= sensorEnd && !autoCalculateSensorEnd) {
      alert("O início do sensor deve ser menor que o fim do sensor.");
      return;
    }

    setProcessedVideoStartAndEnd([videoStart, videoEnd]);

    // Dados cortados
    fetch('/api/cut-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: sensorData,
        start: sensorStart,
        end: autoCalculateSensorEnd ? sensorStart + (videoEnd - videoStart) : sensorEnd,
      }),
    })
    .then(response => response.json())
    .then(data => {
      setProcessedData(data);
      advance();
    })
    .catch(error => {
      console.error('Erro ao cortar dados:', error);
      alert('Erro ao cortar dados do sensor. Veja o console para detalhes.');
    });

    // Video cortado
    //fetch('http://localhost:5000/api/cut-video', {
    //  method: 'POST',
    //  headers: {
    //    'Content-Type': 'application/json',
    //  },
    //  body: JSON.stringify({
    //    filepath: videoFileName,
    //    start: videoStart,
    //    end: videoEnd,
    //  }),
    //})
    //.then(response => response.json())
    //.then(data => {
    //  console.log("Video cortado:", data);
    //  setProcessedVideoPath(data.cutVideoPath);
    //  advance();
    //})
    //.catch(error => {
    //  console.error('Erro ao cortar vídeo:');
    //  alert('Erro ao cortar vídeo. Veja o console para detalhes.');
    //});
  }

  return (
    <div className="editing-box">
        <div className={"video-editing-box" + (editingSensor ? " disabled" : "")}>
            <h1>Vídeo: {videoFileName}</h1>
            <video id="video-player" controls>
                <source src={"/video/"+videoFileName} type="video/mp4"/>
                Your browser does not support the video tag.
            </video>
            <h3>Momento inicial: {videoStart}</h3>
            <h3>Momento final: {videoEnd}</h3>
            <button onClick={() => {setVideoTime(setVideoStart)}}>Definir Momento Inicial</button>
            <button onClick={() => {setVideoTime(setVideoEnd)}}>Definir Momento Final</button>
            {(!editingSensor && videoStart<videoEnd) ? <button onClick={() => setEditingSensor(true)}>Avançar para Sensor</button> : ""}
        </div>
        <div className={"sensor-editing-box" + (!editingSensor ? " disabled" : "")}>
            <h1>Arquivo do sensor: {sensorFileName}</h1>
            {sensorData!==0 ? <D3SensorChart data={sensorData} onSelectTime={(time) => setSensorStart(time)} /> : <Loading />}
            {editingSensor ? <button onClick={() => setEditingSensor(false)}>Voltar ao Vídeo</button> : ""}
            {sensorData!==0 ?
              <>
                Início do Sensor:
                <input type="number" step="0.01" value={sensorStart} onChange={handleChangeStart}/>
              </>
              : ""}
            {sensorData!==0 && !autoCalculateSensorEnd ? 
              <>
                Fim do Sensor:
                <input type="number" step="0.01" value={sensorEnd} onChange={handleChangeEnd}/> 
              </>
              : ""}
              <button onClick={() => {setAutoCalculateSensorEnd(!autoCalculateSensorEnd);}}>
              {autoCalculateSensorEnd ? "Desativar Cálculo Automático do Fim" : "Ativar Cálculo Automático do Fim"} </button>
              <button onClick={handleAdvance}>Avançar</button>
        </div>
    </div>
  );
}

export default DataEditingScreen;