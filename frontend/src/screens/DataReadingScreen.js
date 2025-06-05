
import './DataReadingScreen.css';
import FileReader from "../components/FileReader";
import { useState } from "react";

function DataReadingScreen({setSensorFileName, setVideoFileName, advance}) {
  const [hasSelectedSensor, setHasSelectedSensor] = useState(false);
  const [hasSelectedVideo, setHasSelectedVideo] = useState(false);

  return (
    <div className="App">
      <h1>Leitura dos Dados</h1>
      <h2>Selecione o arquivo de dados do sensor:</h2>
      <FileReader id="sensor-data-reader" setParentFileName={setSensorFileName} setHasSelectedFile={setHasSelectedSensor}/>
      <h2>Selecione o vídeo:</h2>
      <FileReader id="video-reader" setParentFileName={setVideoFileName} setHasSelectedFile={setHasSelectedVideo}/>
      {hasSelectedSensor && hasSelectedVideo ? <button onClick={advance}>Avançar</button> : ""}
    </div>
  );
}

export default DataReadingScreen;