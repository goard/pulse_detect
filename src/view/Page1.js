import { useState, useRef, useEffect } from "react";
import Video from "./Video";
import Canvas from "./Canvas";
import { useMain } from "../context/contextProvider";

const Page1 = () => {
  const [startBtn, setStartBtn] = useState(false);
  const [disableBtn, setDisableBtn] = useState(false);
  const [streamState, setStreamState] = useState(null);
  const [size, setSize] = useState({ height: 240, width: 320 });
  const videoEl = useRef(null);
  const canvasEl = useRef(null);
  const { cv } = useMain();
  const [mat, setMat] = useState({
    src: null,
    dst: null,
    cap: null,
    gray: null,
    faces: null,
    classifier: null,
  });

  const startVideo = () => {
    setDisableBtn(true);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: { width: size.width, height: size.heights },
        })
        .then((stream) => {
          let video = videoEl.current;
          setMat({
            src: new cv.Mat(size.height, size.width, cv.CV_8UC4),
            dst: new cv.Mat(size.height, size.width, cv.CV_8UC1),
            cap: new cv.VideoCapture(video),
            gray: new cv.Mat(),
            faces: new cv.RectVector(),
            classifier: new cv.CascadeClassifier(),
          });
          setStreamState(stream);
          video.srcObject = stream;
          video.play();
        })
        .catch((err) => console.error(err));
    }
  };

  const stopVideo = () => {
    let video = videoEl.current;
    let ctx = canvasEl.current.getContext("2d");

    if (video) {
      video.pause();
      video.srcObject = null;
    }
    if (streamState) {
      streamState.getVideoTracks()[0].stop();
    }
    setStreamState(null);
    setStartBtn(false);
    setMat({
      src: mat.src.delete(),
      dst: mat.dst.delete(),
      gray: mat.gray.delete(),
      faces: mat.faces.delete(),
      classifier: mat.classifier.delete(),
    });

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const onCanPlay = () => {
    mat.classifier.load(`haarcascade_frontalface_default.xml`);
    setStartBtn(true);
    setDisableBtn(false);
  };

  const clickHandler = () => {
    if (startBtn) stopVideo();
    else startVideo();
  };

  useEffect(() => {
    if (startBtn) {
      const FPS = 30;
      let timeoutId;

      const processVideo = () => {
        try {
          let begin = Date.now();
          mat.cap.read(mat.src);
          mat.src.copyTo(mat.dst);
          cv.cvtColor(mat.src, mat.gray, cv.COLOR_RGBA2GRAY, 0);
          // detect faces.
          mat.classifier.detectMultiScale(mat.gray, mat.faces, 1.1, 3, 0);
          // draw faces
          // for (let i = 0; i < mat.faces.size(); ++i) {
          if (mat.faces.size()) {
            let face = mat.faces.get(0);
            let point1 = new cv.Point(
              face.x + face.width / 4.3,
              face.y + face.height / 2.3
            );
            let point2 = new cv.Point(
              face.x + face.width / 1.3,
              face.y + face.height / 1.4
            );

            // let rect = new cv.Rect(
            //   face.x + face.width / 4.3,
            //   face.y + face.height / 2.3,
            //   face.x + face.width / 1.3,
            //   face.y + face.height / 1.4
            // );
            // let gray = mat.gray.roi(rect);
            // console.log(gray);

            cv.rectangle(mat.dst, point1, point2, [255, 0, 0, 255]);
          }
          // cv.ellipse(mat.dst, center, axies, 0, 0, 360, [255, 0, 0, 255]);
          // }
          cv.imshow(canvasEl.current, mat.dst);
          let delay = 1000 / FPS - (Date.now() - begin);
          timeoutId = setTimeout(processVideo, delay);
        } catch (error) {
          console.error(error);
        }
      };
      processVideo();
      return () => clearTimeout(timeoutId);
    }
  });

  return (
    cv && (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1>Hi heardbeat detect use OpenCV</h1>
        <button
          disabled={disableBtn}
          style={{ padding: 10, width: 150, marginBottom: 15 }}
          onClick={clickHandler}
        >
          {startBtn ? "Stop" : "Start"}
        </button>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Video
            elementRef={videoEl}
            videoWidth={320}
            videoHeigth={240}
            onCanPlay={onCanPlay}
          />
          <Canvas elementRef={canvasEl} canvasWidth={320} canvasHeigth={240} />
        </div>
      </div>
    )
  );
};

export default Page1;
