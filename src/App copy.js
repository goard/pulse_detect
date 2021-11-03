import { useEffect, useState, useRef } from "react";
import xmlDataSrc from "./services/haarcascade_frontalface_default.xml";
import cv from "./services/opencv"

const videoHeight = 240;
const videoWidth = 320;

function App() {
  const [startStopVideoToggle, setStartStopVideoToggle] = useState(false);
  const [loadVideoDisableBtn, setLoadVideoDisableBtn] = useState(false);
  const [streamVideo, setStreamVideo] = useState(null);
  // const [cv, setCv] = useState(null);
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
    // ctx.fillStyle = "#000000";
    // ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  function processVideo() {
    try {
      if (startStopVideoToggle) {
        // clean and stop.
        mat.src.delete();
        mat.dst.delete();
        mat.gray.delete();
        mat.faces.delete();
        mat.classifier.delete();
        return;
      }
      let begin = Date.now();
      // start processing.
      mat.cap.read(mat.src);
      mat.src.copyTo(mat.dst);
      cv.cvtColor(mat.dst, mat.gray, cv.COLOR_RGBA2GRAY, 0);
      // detect faces.
      mat.classifier.detectMultiScale(mat.gray, mat.faces, 1.1, 3, 0);
      // draw faces.
      for (let i = 0; i < mat.faces.size(); ++i) {
        let face = mat.faces.get(i);
        // let center = new cv.Point(
        //   face.x + face.width / 2,
        //   face.y + face.height / 2
        // );
        // let axies = new cv.Size(face.width / 3, face.height / 2)
        let point1 = new cv.Point(face.x + face.width / 3, face.y + face.height /3);
        let point2 = new cv.Point(face.x + face.width, face.y + face.height);
        cv.rectangle(mat.dst, point1, point2, [255, 0, 0, 255]);
        // cv.ellipse(mat.dst, center, axies, 0, 0, 360, [255,0,0,255])
      }
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
    // async function loadCv() {
    //   const moduleCv = await import("./services/opencv");
    //   const opencv = await moduleCv.default;
    //   console.log("hi 1");

    //   // setCv(opencv);
    //   cv["onRuntimeInitialized"] = () => {
    //     setMat({
    //       src: new opencv.Mat(videoHeight, videoWidth, opencv.CV_8UC4),
    //       dst: new opencv.Mat(videoHeight, videoWidth, opencv.CV_8UC1),
    //       cap: new opencv.VideoCapture(videoElement.current),
    //       gray: new opencv.Mat(),
    //       faces: new opencv.RectVector(),
    //       classifier: new opencv.CascadeClassifier(),
    //     });
    //   };
    // }
    // loadCv();
    /* eslint-disable-next-line */
    cv["onRuntimeInitialized"] = () => {
      console.log("hi");
      setMat({
        src: new cv.Mat(videoHeight, videoWidth, cv.CV_8UC4),
        dst: new cv.Mat(videoHeight, videoWidth, cv.CV_8UC1),
        cap: new cv.VideoCapture(videoElement.current),
        gray: new cv.Mat(),
        faces: new cv.RectVector(),
        classifier: new cv.CascadeClassifier(),
      });
    };
  }, []);

  useEffect(() => {
    if (mat.classifier) {
      console.log(mat.classifier)
      const createFileFromUrl = function (path, url, callback) {
        let request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";
        request.onload = function (ev) {
          if (request.readyState === 4) {
            if (request.status === 200) {
              // console.log(request.response);
              let data = new Uint8Array(request.response);
              // console.log("data", data);
              cv.FS_createDataFile("/", path, data, true, false, false);
              callback();
            } else {
              console.log(
                "Failed to load " + url + " status: " + request.status
              );
            }
          }
        };
        request.send();
      };

      function loadHaarcascade() {
        mat.classifier.load("haarcascade_frontalface_default.xml");
      }
      createFileFromUrl(
        "haarcascade_frontalface_default.xml",
        xmlDataSrc,
        loadHaarcascade
      );

      // console.log(mat.classifier);
    }
  }, [mat]);

  console.log(mat)

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
