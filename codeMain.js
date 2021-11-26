function main() {
  let video = document.getElementById("videoInput");
  let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  let dst = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  let gray = new cv.Mat();
  let tempMat = new cv.Mat();
  let cap = new cv.VideoCapture(video);
  let faces = new cv.RectVector();
  let classifier = new cv.CascadeClassifier();
  let roi = new cv.Mat();
  let meanArr = [];
  let tempArr = [];
  let hammingMat = null;
  let meanMat = null;
  let timesArr = [];
  let bmp = 0;

  // load pre-trained classifiers
  classifier.load("haarcascade_frontalface_default.xml");

  const FPS = 30;
  function processVideo() {
    try {
      if (!streaming) {
        // clean and stop.
        src.delete();
        dst.delete();
        gray.delete();
        faces.delete();
        classifier.delete();
        roi.delete();
        return;
      }
      let begin = Date.now();
      timesArr.push(begin);

      // start processing.
      cap.read(src);
      src.copyTo(dst);
      cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY, 0);

      // detect faces.
      classifier.detectMultiScale(gray, faces, 1.1, 3, 0);

      // draw faces.
      // for (let i = 0; i < faces.size(); ++i) {
      if (faces.size() === 1) {
        let face = faces.get(0);
        let point1 = new cv.Point(
          face.x + face.width / 4.3,
          face.y + face.height / 2.1
        );
        let point2 = new cv.Point(
          face.x + face.width / 1.3,
          face.y + face.height / 1.4
        );
        let rect = new cv.Rect(
          face.x + face.width / 4.3,
          face.y + face.height / 2.1,
          face.x + face.width / 1.3 - (face.x + face.width / 4.3),
          face.y + face.height / 1.4 - (face.y + face.height / 2.1)
        );

        roi = gray.roi(rect);
        let mean = cv.mean(roi);

        // console.log("mean",mean[0])

        meanArr.push(mean[0]);

        if (meanArr.length > 125) {
          meanMat = cv.matFromArray(1, meanArr.length, cv.CV_32F, meanArr);
          cv.normalize(meanMat, meanMat, -1, 1, cv.NORM_MINMAX, cv.CV_32F);

          // Calculate window function Hamming
          tempArr = hamming(meanArr.length);
          hammingMat = cv.matFromArray(1, tempArr.length, cv.CV_32F, tempArr);
          cv.multiply(meanMat, hammingMat, meanMat);

          /** Calculate DFT */
          cv.dft(meanMat, meanMat, (flags = cv.DFT_COMPLEX_OUTPUT));
          let planes = new cv.MatVector();
          cv.split(meanMat, planes);
          cv.pow(planes.get(0), 2, meanMat);
          cv.pow(planes.get(1), 2, tempMat);
          cv.add(meanMat, tempMat, meanMat);
          cv.sqrt(meanMat, meanMat);
          console.log("meanMat", meanMat);

          /**Calculate frequency */
          let fps =
            (meanArr.length / (timesArr[timesArr.length - 1] - timesArr[0])) *
            1000;
          console.log("fps", fps);
          frequencyCalcArr(tempMat, fps, meanArr.length);
          tempArr = where(tempMat);
          // console.log("tempArr", tempArr);
          let rectTemp = new cv.Rect(tempArr[0], 0, tempArr.length, 1);
          let dstTemp = meanMat.roi(rectTemp);
          let minmax = cv.minMaxLoc(dstTemp);
          bmp = tempMat.data32F[tempArr[0] + minmax.maxLoc.x];
          console.log("minmax", minmax);
          console.log("bmp", bmp);
          // console.log("planes",planes.get(0))
          meanArr.shift();
          timesArr.shift();
        }

        cv.putText(
          dst,
          `bmp ${bmp?bmp:0}`,
          new cv.Point(10, 25),
          cv.FONT_HERSHEY_PLAIN,
          1.85,
          [5, 5, 100, 255]
        );
        cv.line(dst, point1, point2, [123, 233, 0, 255]);
        cv.rectangle(dst, point1, point2, [255, 0, 0, 255]);
      }
      // }
      cv.imshow("canvasOutput", dst);
      // schedule the next one.
      let delay = 1000 / FPS - (Date.now() - begin);
      setTimeout(processVideo, delay);
    } catch (err) {
      utils.printError(err);
    }
  }

  function hamming(countDown) {
    let arr = [];
    for (let i = 0; i < countDown; i++) {
      arr[i] =
        0.53836 - 0.46164 * Math.cos((2 * Math.PI * i) / (countDown - 1));
    }
    return arr;
  }

  function arange(countDown) {
    let arr = [];
    for (let i = 0; i < countDown; i++) {
      arr[i] = i;
    }
    return arr;
  }

  function frequencyCalc(fps, countDown) {
    let freq = (fps / countDown) * 60;
    let arr = [];
    for (let i = 0; i < countDown; i++) {
      arr[i] = freq;
    }
    return arr;
  }

  function frequencyCalcArr(mat, fps, countDown) {
    let arr = new cv.Mat();
    let arangeArr = arange(countDown);
    let arangeMat = cv.matFromArray(1, arangeArr.length, cv.CV_32F, arangeArr);
    let frequencyArr = frequencyCalc(fps, countDown);
    let frequencyMat = cv.matFromArray(
      1,
      frequencyArr.length,
      cv.CV_32F,
      frequencyArr
    );

    cv.multiply(arangeMat, frequencyMat, frequencyMat);
    frequencyMat.copyTo(mat);
    arangeMat.delete();
    frequencyMat.delete();
    return;
  }

  function where(mat) {
    let arr = [];
    for (let i = 0; i < mat.data32F.length; i++) {
      if (mat.data32F[i] > 50 && mat.data32F[i] < 180) {
        arr.push(i);
      }
    }
    return arr;
  }

  // schedule the first one.
  setTimeout(processVideo, 0);
}
