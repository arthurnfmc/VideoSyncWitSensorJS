import Loading from "../components/Loading";
import "./MainScreen.css";
import { useState, useEffect, useRef } from "react";
import D3SensorLineChart from "../components/D3SensorLineChart";

function MainScreen({ videoFileName, processedData, processedVideoStartAndEnd}) {
    const FRAME_RATE = 60;
    const FRAME_TIME = 1 / FRAME_RATE;

    const [loading, setLoading] = useState(true);
    const videoRef = useRef();

    const [currentFrame, setCurrentFrame] = useState(0);
    const totalFrames = Math.floor((processedVideoStartAndEnd[1] - processedVideoStartAndEnd[0]) * FRAME_RATE);
    
    // Display do video recortado
    useEffect(() => {
        const video = document.getElementById("video-display");
        
        const updateFrame = () => {
            const frame = Math.floor((video.currentTime - processedVideoStartAndEnd[0]) * FRAME_RATE);
            setCurrentFrame(Math.max(0, Math.min(frame, totalFrames)));
        };

        // Começa o vídeo no tempo inicial
        video.addEventListener("loadedmetadata", () => {
            video.currentTime = processedVideoStartAndEnd[0];
            updateFrame();
        });

        // Não ultrapassa o limite estabelecido
        video.addEventListener('timeupdate', () => {
            if (video.currentTime >= processedVideoStartAndEnd[1]) {
                video.pause();
                video.currentTime = processedVideoStartAndEnd[1];
            }
            
            if (video.currentTime < processedVideoStartAndEnd[0]) {
                video.pause();
                video.currentTime = processedVideoStartAndEnd[0];
            }
            updateFrame();
        });

        setLoading(false);
    }, [processedVideoStartAndEnd]);



    // Botões frame a frame
    const stepBackward = () => {
        const video = videoRef.current;
        video.pause();
        video.currentTime = Math.max(processedVideoStartAndEnd[0], video.currentTime - FRAME_TIME);
    };

    const stepForward = () => {
        const video = videoRef.current;
        video.pause();
        video.currentTime = Math.min(processedVideoStartAndEnd[1], video.currentTime + FRAME_TIME);
    };

    return (
        <> 
        {loading ? <Loading></Loading>: ""}
        <div className={"main-screen-layout"}>
        <div className={"video-container"+ (loading ? " disabled" : "")}>
            <h1>Vídeo: {videoFileName}</h1>
            <video ref={videoRef} id="video-display" controls>
                <source src={"/video/"+videoFileName} type="video/mp4"/>
                <source src={"/video/"+videoFileName} type="video/webm"/>
                <source src={"/video/"+videoFileName} type="video/ogg"/>
                Your browser does not support the video tag.
            </video>
            <div className="video-controls">
                <button onClick={stepBackward}>◀ Frame</button>
                <span>Frame {currentFrame} / {totalFrames}</span>
                <button onClick={stepForward}>Frame ▶</button>
            </div>
        </div>
        <D3SensorLineChart
            className={"sensor-chart" + (loading ? " disabled" : "")}
            videoRef={videoRef}
            data={processedData}
            preSelectedFeatures={[]}
            videoStartTime={processedVideoStartAndEnd[0]}>
        </D3SensorLineChart>
        </div>
        </>
    );
}

export default MainScreen;