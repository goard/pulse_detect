import { useEffect, useState, useRef } from "react";
// import cv from "./services/opencv";

const videoHeight = 240;
const videoWidth = 320;

function App() {
  const [startStopVideoToggle, setStartStopVideoToggle] = useState(false);
  const [loadVideoDisableBtn, setLoadVideoDisableBtn] = useState(false);
  const [streamVideo, setStreamVideo] = useState(null);
  const [cv, setCv] = useState(null);
  const [mat, setMat] = useState({
    src: null,
    dst: null,
    cap: null,
    gray: null,
    faces: null,
    classifier: null,
  });
  const videoElement = useRef(null);
  const canvasEl = useRef(null);
  const FPS = 30;

  async function initCamera() {
    setLoadVideoDisableBtn(true);
    let video = videoElement.current;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: videoWidth,
          height: videoHeight,
        },
      });
      video.srcObject = stream;
      setStreamVideo(stream);

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
    if (video) {
      video.pause();
      video.srcObject = null;
    }
    if (streamVideo) streamVideo.getVideoTracks()[0].stop();
    setStartStopVideoToggle(false);
    let ctx = canvasEl.current.getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // ctx.clearRect(0, 0, 250, 250);
  }

  function processVideo() {
    try {
      if (startStopVideoToggle) {
        // clean and stop.
        mat.src.delete();
        mat.dst.delete();
        return;
      }
      let begin = Date.now();
      // start processing.
      mat.cap.read(mat.src);
      cv.cvtColor(mat.src, mat.dst, cv.COLOR_RGBA2GRAY);
      cv.imshow(canvasEl.current, mat.dst);
      // schedule the next one.
      let delay = 1000 / FPS - (Date.now() - begin);
      setTimeout(processVideo, delay);
    } catch (err) {
      console.log(err);
    }
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
      setTimeout(processVideo, 0);
    }
  }

  useEffect(() => {
    async function loadCv() {
      const moduleCv = await import("./services/opencv");
      const opencv = await moduleCv.default;
      console.log("hi 1");
      setCv(opencv);
      setMat({
        src: new opencv.Mat(videoHeight, videoWidth, opencv.CV_8UC4),
        dst: new opencv.Mat(videoHeight, videoWidth, opencv.CV_8UC1),
        cap: new opencv.VideoCapture(videoElement.current),
        gray: new opencv.Mat(),
        faces: new opencv.RectVector(),
        classifier: new opencv.CascadeClassifier(),
      });
    }
    loadCv();
  }, []);

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
            width={videoWidth}
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
            width={videoWidth}
            height={videoHeight}
          ></canvas>
          <p>Canvas</p>
        </div>
      </div>
    </div>
  );
}

export default App;
