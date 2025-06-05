import './App.css';
import DataReadingScreen from './screens/DataReadingScreen';
import DataEditingScreen from './screens/DataEditingScreen';
import { useState } from 'react';

function App() {
  const [sensorFileName, setSensorFileName] = useState("");
  const [videoFileName, setVideoFileName] = useState("");
  const [currentScreen, setCurrentScreen] = useState(0);
  const advance = () => {setCurrentScreen(currentScreen + 1);}

  return (
    <>
      {currentScreen===0 ? <DataReadingScreen setSensorFileName={setSensorFileName} setVideoFileName={setVideoFileName} advance={advance}></DataReadingScreen> :
       currentScreen===1 ? <DataEditingScreen sensorFileName={sensorFileName} videoFileName={videoFileName} advance={advance}></DataEditingScreen> :
       currentScreen===2 ? "Tela de Resultados" : ""}
    </>
  );
}

export default App;
