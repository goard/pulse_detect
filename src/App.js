import { useEffect, useState, useRef } from "react";
import cv from "./services/cv";

const maxVideoSize = 200;

function App() {
  const [processing, updateProcessing] = useState(false);
  const [readySW, setReadySW] = useState(false);
  const videoElement = useRef(null);
  const canvasEl = useRef(null);
  /**
   * In the onClick event we'll capture a frame within
   * the video to pass it to our service.
   */
  async function onClick() {
    // это наше приложение:
    updateProcessing(true);
    const ctx = canvasEl.current.getContext("2d");
    ctx.drawImage(videoElement.current, 0, 0, maxVideoSize, maxVideoSize);
    const image = ctx.getImageData(0, 0, maxVideoSize, maxVideoSize);
    // Processing image
    // This converts the image to a greyscale.
    const processedImage = await cv.imageProcessing(image);
    // Render the processed image to the canvas
    ctx.putImageData(processedImage.data.payload, 0, 0);
    updateProcessing(false);
  }

  /**
   * In the useEffect hook we'll load the video
   * element to show what's on camera.
   */
  useEffect(() => {
    async function initCamera() {
      videoElement.current.width = maxVideoSize;
      videoElement.current.height = maxVideoSize;

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: maxVideoSize,
            height: maxVideoSize,
          },
        });
        videoElement.current.srcObject = stream;

        return new Promise((resolve) => {
          videoElement.current.onloadedmetadata = () => {
            resolve(videoElement.current);
          };
        });
      }
      const errorMessage =
        "This browser does not support video capture, or this device does not have a camera";
      alert(errorMessage);
      return Promise.reject(errorMessage);
    }

    async function load() {
      const videoLoaded = await initCamera();
      videoLoaded.play();
      return videoLoaded;
    }

    load();

    async function loadSW () {
      await cv.load()
      setReadySW(true)
    }
    // Load opencv from service worker
    loadSW()
  
  }, []);

  // useEffect(() => {
  //   const ctx = canvasEl.current.getContext("2d");
  //   const FPS = 30;
  //   if (readySW) {
  //     async function processVideo() {
  //       let begin = Date.now();
  //       ctx.drawImage(videoElement.current, 0, 0, maxVideoSize, maxVideoSize);
  //       const image = ctx.getImageData(0, 0, maxVideoSize, maxVideoSize).data;
  //       // Processing image

  //       // Render the processed image to the canvas
  //       ctx.clearRect(0, 0, maxVideoSize, maxVideoSize);
  //       ctx.putImageData(processedVideo.data.payload, 0, 0);
  //       let delay = 1000 / FPS - (Date.now() - begin);
  //       setTimeout(processVideo, delay);
  //     }
  //     // const intervalId = setTimeout(processVideo, 0);
  //     // return () => {
  //     //   clearTimeout(intervalId);
  //     // };
  //   }
  // }, [readySW]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <video className="video" playsInline ref={videoElement} />
      Video
      <button
        disabled={processing}
        style={{ width: maxVideoSize, padding: 10 }}
        onClick={onClick}
      >
        {processing ? "Processing..." : "Take a photo"}
      </button>
      <canvas
        id="canvas"
        ref={canvasEl}
        width={maxVideoSize}
        height={maxVideoSize}
      ></canvas>
      Canvas
    </div>
  );
}

export default App;
