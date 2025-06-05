import './DataEditingScreen.css';
import { useState } from 'react';

function DataEditingScreen({sensorFileName, videoFileName, advance}) {
  const [editingSensor, setEditingSensor] = useState(false);

  return (
    <div className="editing-box">
        <div className={"video-editing-box" + (editingSensor ? " disabled" : "")}>
            <h1>Vídeo: {videoFileName}</h1>
            <video id="video-player" controls>
                <source src={"E:/Programas/ExpressWit/public/data/"+videoFileName} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            {!editingSensor ? <button onClick={() => setEditingSensor(true)}>Avançar para Sensor</button> : ""}
        </div>
        <div className={"sensor-editing-box" + (!editingSensor ? " disabled" : "")}>
            
            <h1>ahahahaha</h1>
            {editingSensor ? <button onClick={() => setEditingSensor(false)}>Voltar ao Vídeo</button> : ""}
        </div>
    </div>
  );
}

export default DataEditingScreen;