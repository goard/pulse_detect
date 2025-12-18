const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('overlay');
const canvasCtx = canvasElement.getContext('2d');
const bpmValue = document.getElementById('bpm-value');
const toggleBtn = document.getElementById('toggle-btn');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const pulseGraphCanvas = document.getElementById('pulse-graph');
const pulseGraphCtx = pulseGraphCanvas.getContext('2d');

let isRunning = false;
let camera = null;
const processor = new SignalProcessor(150, 30);
let pulseHistory = [];

// Initialize MediaPipe Face Mesh
const faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

faceMesh.onResults(onResults);

function onResults(results) {
    // Resize overlay canvas to match video
    if (canvasElement.width !== videoElement.videoWidth) {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        pulseGraphCanvas.width = pulseGraphCanvas.parentElement.clientWidth;
        pulseGraphCanvas.height = pulseGraphCanvas.parentElement.clientHeight;
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Draw basic mesh for visual feedback (subtle)
        drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, { color: '#00f2ff33', lineWidth: 1 });

        // Extract ROI (Forehead area)
        const foreheadPoints = [10, 151, 9, 8, 67, 103, 109, 285, 297, 332];
        const roi = getROI(landmarks, foreheadPoints);

        // Visualize ROI
        canvasCtx.strokeStyle = '#00f2ff';
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeRect(roi.x, roi.y, roi.width, roi.height);

        // Get mean RGB from ROI
        const rgb = getMeanRGB(videoElement, roi);
        if (rgb) {
            processor.push(rgb);
            const signal = processor.processPOS();
            if (signal) {
                const bpm = processor.calculateBPM(signal);
                bpmValue.innerText = bpm > 0 ? bpm : '--';

                // Update graph
                const latestSignal = signal[signal.length - 1];
                updatePulseGraph(latestSignal);

                statusDot.classList.add('active');
                statusText.innerText = "Измерение...";
            }
        }
    } else {
        statusDot.classList.remove('active');
        statusText.innerText = "Лицо не обнаружено";
        bpmValue.innerText = '--';
    }
    canvasCtx.restore();
}

function getROI(landmarks, indices) {
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    indices.forEach(idx => {
        const p = landmarks[idx];
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    });

    // Add some padding
    const width = (maxX - minX) * canvasElement.width;
    const height = (maxY - minY) * canvasElement.height;
    return {
        x: minX * canvasElement.width,
        y: minY * canvasElement.height,
        width: width,
        height: height
    };
}

function getMeanRGB(video, roi) {
    if (roi.width <= 0 || roi.height <= 0) return null;

    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    tempCanvas.width = 1;
    tempCanvas.height = 1;

    // Drawing only the ROI onto a 1x1 canvas automatically averages the pixels
    ctx.drawImage(video, roi.x, roi.y, roi.width, roi.height, 0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;

    return { r: data[0], g: data[1], b: data[2] };
}

function updatePulseGraph(value) {
    pulseHistory.push(value);
    if (pulseHistory.length > 100) pulseHistory.shift();

    pulseGraphCtx.clearRect(0, 0, pulseGraphCanvas.width, pulseGraphCanvas.height);
    pulseGraphCtx.beginPath();
    pulseGraphCtx.strokeStyle = '#00f2ff';
    pulseGraphCtx.lineWidth = 3;
    pulseGraphCtx.lineJoin = 'round';

    const step = pulseGraphCanvas.width / 100;
    const midY = pulseGraphCanvas.height / 2;
    const scale = 5000; // Adjust based on signal amplitude

    pulseHistory.forEach((val, i) => {
        const x = i * step;
        const y = midY - (val * scale);
        if (i === 0) pulseGraphCtx.moveTo(x, y);
        else pulseGraphCtx.lineTo(x, y);
    });
    pulseGraphCtx.stroke();
}

async function startApp() {
    toggleBtn.disabled = true;
    try {
        camera = new Camera(videoElement, {
            onFrame: async () => {
                await faceMesh.send({ image: videoElement });
            },
            width: 640,
            height: 480
        });
        await camera.start();
        isRunning = true;
        toggleBtn.innerText = "Остановить";
        toggleBtn.classList.add('stop');
        statusText.innerText = "Система активна";
    } catch (e) {
        console.error(e);
        statusText.innerText = "Ошибка камеры";
    }
    toggleBtn.disabled = false;
}

function stopApp() {
    if (camera) {
        camera.stop();
    }
    isRunning = false;
    toggleBtn.innerText = "Запустить";
    toggleBtn.classList.remove('stop');
    statusDot.classList.remove('active');
    statusText.innerText = "Система готова";
    bpmValue.innerText = '--';
    pulseHistory = [];
    pulseGraphCtx.clearRect(0, 0, pulseGraphCanvas.width, pulseGraphCanvas.height);
}

toggleBtn.addEventListener('click', () => {
    if (isRunning) stopApp();
    else startApp();
});
