import './DataEditingScreen.css';
import { useState, useEffect } from 'react';
import D3SensorChart from '../components/D3SensorChart';
import Loading from '../components/Loading';

function DataEditingScreen({sensorFileName, videoFileName, advance}) {
  const [editingSensor, setEditingSensor] = useState(false);
  const [videoStart, setVideoStart] = useState(0);
  const [videoEnd, setVideoEnd] = useState(0);
  const [sensorData, setSensorData] = useState(0);
  const [sensorStart, setSensorStart] = useState(0);
  const [sensorEnd, setSensorEnd] = useState(0);
  const [autoCalculateSensorEnd, setAutoCalculateSensorEnd] = useState(true);
  
  // Get sensor data
  useEffect(() => {
    fetch('http://localhost:5000/api/sensor-data', {
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
  }, []);

  // Get the video size
  useEffect(() => {
    const vid = document.getElementById('video-player');
    vid.addEventListener('loadedmetadata', function() {
      setVideoEnd(vid.duration.toFixed(2));
    }); 
  }, []);

  // Set video time function
  const setVideoTime = (setFunc) => {
    const vid = document.getElementById('video-player');
    setFunc(vid.currentTime);
  }

  const handleChangeStart = (e) => {
    const floatVal = parseFloat(e.target.value);
    setSensorStart(isNaN(floatVal) ? 0.0 : floatVal);
  };

  const handleChangeEnd = (e) => {
    const floatVal = parseFloat(e.target.value);
    setSensorEnd(isNaN(floatVal) ? 0.0 : floatVal);
  };

  const handleAdvance = () => {
    if (autoCalculateSensorEnd) {
      if (sensorStart + (videoEnd - videoStart) > sensorData[sensorData.length - 1]['seconds_passed']) {
        alert("O fim do sensor calculado ultrapassa o último dado do sensor.");
        return;
      }
      setSensorEnd(sensorStart + (videoEnd - videoStart));
    }
    if (videoStart >= videoEnd) {
      alert("O momento inicial do vídeo deve ser menor que o momento final.");
      return;
    }
    if (sensorStart >= sensorEnd && !autoCalculateSensorEnd) {
      alert("O início do sensor deve ser menor que o fim do sensor.");
      return;
    }


    advance();
  }

  return (
    <div className="editing-box">
        <div className={"video-editing-box" + (editingSensor ? " disabled" : "")}>
            <h1>Vídeo: {videoFileName}</h1>
            <video id="video-player" controls>
                <source src={videoFileName} type="video/mp4"/>
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
            {sensorData!==0 ? <D3SensorChart data={sensorData}></D3SensorChart> : <Loading />}
            {editingSensor ? <button onClick={() => setEditingSensor(false)}>Voltar ao Vídeo</button> : ""}
            {sensorData!==0 ?
              <>
                Início do Sensor:
                <input type="text" step="any" value={sensorStart} onChange={handleChangeStart}/>
              </>
              : ""}
            {sensorData!==0 && !autoCalculateSensorEnd ? 
              <>
                Fim do Sensor:
                <input type="text" step="any" value={sensorEnd} onChange={handleChangeEnd}/> 
              </>
              : ""}
              <button onClick={() => {setAutoCalculateSensorEnd(!autoCalculateSensorEnd);}}>
              {autoCalculateSensorEnd ? "Desativar Cálculo Automático do Fim" : "Ativar Cálculo Automático do Fim"} </button>
        </div>
    </div>
  );
}

export default DataEditingScreen;