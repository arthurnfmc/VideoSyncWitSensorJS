import './App.css';
import DataReadingScreen from './screens/DataReadingScreen';
import DataEditingScreen from './screens/DataEditingScreen';
import MainScreen from './screens/MainScreen';
import { useState } from 'react';

function App() {
  const [sensorFileName, setSensorFileName] = useState("");
  const [videoFileName, setVideoFileName] = useState("");
  const [currentScreen, setCurrentScreen] = useState(0);

  const [processedData, setProcessedData] = useState([]);
  const [processedVideoStartAndEnd, setProcessedVideoStartAndEnd] = useState([0, 0]);

  const advance = () => {
    setCurrentScreen(currentScreen + 1);
    console.log("Current screen: " + currentScreen);
  }

  return (
    <>
      {currentScreen===0 ? <DataReadingScreen setSensorFileName={setSensorFileName} setVideoFileName={setVideoFileName} advance={advance}></DataReadingScreen> :
       currentScreen===1 ? <DataEditingScreen sensorFileName={sensorFileName} videoFileName={videoFileName} setProcessedData={setProcessedData} setProcessedVideoStartAndEnd={setProcessedVideoStartAndEnd} advance={advance}></DataEditingScreen> :
       currentScreen===2 ? <MainScreen videoFileName={videoFileName} processedData={processedData} processedVideoStartAndEnd={processedVideoStartAndEnd}></MainScreen> : ""}
    </>
  );
}

export default App;
