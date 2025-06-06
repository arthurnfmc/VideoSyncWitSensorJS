import Loading from "../components/Loading";
import "./MainScreen.css";
import { useState, useEffect, useRef } from "react";
import D3SensorLineChart from "../components/D3SensorLineChart";



function MainScreen({ videoFileName, processedData, processedVideoStartAndEnd}) {
    const [loading, setLoading] = useState(true);
    const videoRef = useRef();
    useEffect(() => {
        const video = document.getElementById("video-display");
        
        // Começa o vídeo no tempo inicial
        video.addEventListener("loadedmetadata", () => {
            video.currentTime = processedVideoStartAndEnd[0];
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
        });

        setLoading(false);
    }, []);

    return (
        <> 
        {loading ? <Loading></Loading>: ""}
        <div className={"video-container"+ (loading ? " disabled" : "")}>
            <h1>Vídeo: {videoFileName}</h1>
            <video ref={videoRef} id="video-display" controls>
                <source src={videoFileName} type="video/mp4"/>
                Your browser does not support the video tag.
            </video>
        </div>
        <D3SensorLineChart
            className={"sensor-chart" + (loading ? " disabled" : "")}
            videoRef={videoRef}
            data={processedData}
            preSelectedFeatures={[]}
            videoStartTime={processedVideoStartAndEnd[0]}>
        </D3SensorLineChart>
        </>
    );
}

export default MainScreen;