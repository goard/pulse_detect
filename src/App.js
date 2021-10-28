import { useEffect, useState, useRef } from "react";
import cv from "./services/opencv";

const videoHeight = 240;
const videoWidht = 320;

function App() {
  const [startStopVideoToggle, setStartStopVideoToggle] = useState(false);
  const [loadVideoDisableBtn, setLoadVideoDisableBtn] = useState(false);
  const videoElement = useRef(null);
  const canvasEl = useRef(null);

  async function initCamera() {
    setLoadVideoDisableBtn(true);
    let video = videoElement.current;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: videoWidht,
          height: videoHeight,
        },
      });
      video.srcObject = stream;

      return new Promise((resolve) => {
        video.oncanplay = () => {
          resolve(video);
          setLoadVideoDisableBtn(false);
        };
      });
    }
    const errorMessage =
      "This browser does not support video capture, or this device does not have a camera";
    alert(errorMessage);
    return Promise.reject(errorMessage);
  }

  async function loadVideo() {
    const videoLoaded = await initCamera();
    videoLoaded.play();
    setStartStopVideoToggle(true);
  }

  function stopVideo() {
    let video = videoElement.current;
    video.pause();
    video.srcObject = null;
    setStartStopVideoToggle(false);
  }

  /**
   * In the onClick event we'll capture a frame within
   * the video to pass it to our service.
   */
  function onClick() {
    if (startStopVideoToggle) {
      stopVideo();
    } else {
      loadVideo();
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1>Hi heardbeat detect use OpenCV</h1>
      <button
        disabled={loadVideoDisableBtn}
        style={{ width: 150, padding: 10, marginBottom: 15 }}
        onClick={onClick}
      >
        {startStopVideoToggle ? "Stop" : "Start"}
      </button>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <video
            className="video"
            width={videoWidht}
            height={videoHeight}
            playsInline
            ref={videoElement}
          />
          <p>Video</p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <canvas
            id="canvas"
            ref={canvasEl}
            width={videoWidht}
            height={videoHeight}
          ></canvas>
          <p>Canvas</p>
        </div>
      </div>
    </div>
  );
}

export default App;
