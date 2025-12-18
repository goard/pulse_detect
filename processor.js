class SignalProcessor {
    constructor(bufferSize = 150, fps = 30) {
        this.bufferSize = bufferSize;
        this.fps = fps;
        this.rawBuffer = []; // Will store {r, g, b}
        this.bpm = 0;
    }

    push(rgb) {
        this.rawBuffer.push(rgb);
        if (this.rawBuffer.length > this.bufferSize) {
            this.rawBuffer.shift();
        }
    }

    /**
     * POS (Plane-Orthogonal-to-Skin) Algorithm
     * Extracts pulse signal from RGB data
     */
    processPOS() {
        if (this.rawBuffer.length < this.bufferSize) return null;

        // 1. Sliding window normalization
        const window = this.rawBuffer;
        const meanR = window.reduce((a, b) => a + b.r, 0) / window.length;
        const meanG = window.reduce((a, b) => a + b.g, 0) / window.length;
        const meanB = window.reduce((a, b) => a + b.b, 0) / window.length;

        const normR = window.map(c => c.r / (meanR || 1));
        const normG = window.map(c => c.g / (meanG || 1));
        const normB = window.map(c => c.b / (meanB || 1));

        // 2. Projection
        // P = [0 1 -1; -2 1 1]
        const X = normG.map((g, i) => g - normB[i]);
        const Y = normG.map((g, i) => g + normB[i] - 2 * normR[i]);

        // 3. Alpha calculation (Standard Deviation)
        const stdX = this.getStd(X);
        const stdY = this.getStd(Y);
        const alpha = stdX / (stdY || 0.0001);

        // 4. Combined signal
        let signal = X.map((x, i) => x + (alpha * Y[i]));

        // 5. Signal cleaning (detrend & filter)
        signal = this.detrend(signal);
        signal = this.hamming(signal);

        return signal;
    }

    getStd(arr) {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const squareDiffs = arr.map(value => Math.pow(value - mean, 2));
        return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / arr.length);
    }

    detrend(signal) {
        const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
        return signal.map(s => s - mean);
    }

    hamming(signal) {
        const size = signal.length;
        return signal.map((s, i) => s * (0.54 - 0.46 * Math.cos(2 * Math.PI * i / (size - 1))));
    }

    calculateBPM(signal) {
        if (!signal) return 0;

        const n = signal.length;
        // Simple DFT for peak detection
        let maxAmp = 0;
        let peakFreq = 0;

        // Search range: 45 BPM (0.75 Hz) to 180 BPM (3 Hz)
        const minFreq = 0.75;
        const maxFreq = 3.0;

        for (let freq = minFreq; freq <= maxFreq; freq += 0.01) {
            let real = 0;
            let imag = 0;
            for (let t = 0; t < n; t++) {
                const angle = 2 * Math.PI * freq * (t / this.fps);
                real += signal[t] * Math.cos(angle);
                imag -= signal[t] * Math.sin(angle);
            }
            const amp = Math.sqrt(real * real + imag * imag);
            if (amp > maxAmp) {
                maxAmp = amp;
                peakFreq = freq;
            }
        }

        this.bpm = Math.round(peakFreq * 60);
        return this.bpm;
    }
}
