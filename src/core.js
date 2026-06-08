/* ================================================================
   TapeLoop Core — testable pure functions and audio utilities
   v0.7.0
   ================================================================ */

export const STEPS = 16;
export const PADS = 16;
export const BANKS = ['A', 'B', 'C', 'D'];
export const SONG_SLOTS = 16;

export const padNames = [
  "KICK","SNARE","CLAP","HAT",
  "BASS","KEYS","PAD","FX",
  "PERC","VOX","BELL","NOISE",
  "SYN1","SYN2","SYN3","SYN4"
];

export function createEmptyPattern() {
  return Array.from({length: 4}, () =>
    Array.from({length: STEPS}, () => ({ active: false, prob: 1.0, locks: {} }))
  );
}

export function normalizePattern(p) {
  if (!p || !Array.isArray(p)) return createEmptyPattern();
  return p.map(row => {
    if (!Array.isArray(row)) row = new Array(STEPS).fill(false);
    return row.map(step => {
      if (typeof step === 'boolean') {
        return { active: step, prob: 1.0, locks: {} };
      }
      if (typeof step !== 'object' || step === null) {
        return { active: false, prob: 1.0, locks: {} };
      }
      return {
        active: !!step.active,
        prob: typeof step.prob === 'number' ? step.prob : 1.0,
        locks: step.locks && typeof step.locks === 'object' ? step.locks : {}
      };
    });
  });
}

export function createDefaultPadSettings() {
  return {
    pitchSemitones: 0,
    pitchFine: 0,
    slices: [],
    stretchedBuffer: null,
    stretchRatio: 1,
    chopMode: false
  };
}

export function createDefaultPatterns() {
  return {
    A: createEmptyPattern(),
    B: createEmptyPattern(),
    C: createEmptyPattern(),
    D: createEmptyPattern()
  };
}

export function createEmptySongChain() {
  return Array(SONG_SLOTS).fill(null);
}

// Auto-slice into equal segments
export function autoSlice(buf, numSlices) {
  if (!buf) return [];
  const len = buf.length;
  const sliceSize = Math.floor(len / numSlices);
  const slices = [];
  for (let i = 0; i < numSlices; i++) {
    slices.push({
      start: i * sliceSize,
      end: (i === numSlices - 1) ? len : (i + 1) * sliceSize
    });
  }
  return slices;
}

// FFT / IFFT
export function fft(real, imag) {
  const n = real.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wlen_cos = Math.cos(ang), wlen_sin = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let w_real = 1, w_imag = 0;
      for (let j = 0; j < len / 2; j++) {
        const u_real = real[i+j], u_imag = imag[i+j];
        const v_real = real[i+j+len/2] * w_real - imag[i+j+len/2] * w_imag;
        const v_imag = real[i+j+len/2] * w_imag + imag[i+j+len/2] * w_real;
        real[i+j] = u_real + v_real;
        imag[i+j] = u_imag + v_imag;
        real[i+j+len/2] = u_real - v_real;
        imag[i+j+len/2] = u_imag - v_imag;
        const next_w_real = w_real * wlen_cos - w_imag * wlen_sin;
        w_imag = w_real * wlen_sin + w_imag * wlen_cos;
        w_real = next_w_real;
      }
    }
  }
}

export function ifft(real, imag) {
  const n = real.length;
  fft(imag, real);
  for (let i = 0; i < n; i++) {
    real[i] /= n;
    imag[i] /= n;
  }
}

// Phase vocoder time-stretch (requires audioCtx for output buffer creation)
export function phaseVocoder(inputBuffer, ratio, audioCtx) {
  const sr = inputBuffer.sampleRate;
  const ch = inputBuffer.numberOfChannels;
  const len = inputBuffer.length;

  // Mono mixdown for processing
  const input = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    let s = 0;
    for (let c = 0; c < ch; c++) s += inputBuffer.getChannelData(c)[i];
    input[i] = s / ch;
  }

  const W = 2048;
  const H = 512;
  const outputLen = Math.max(1, Math.floor(len * ratio));
  const out = new Float32Array(outputLen);

  const hann = new Float32Array(W);
  for (let i = 0; i < W; i++) hann[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (W - 1));

  const numFrames = Math.max(1, Math.floor((len - W) / H) + 1);

  // Analyze
  const frames = [];
  for (let f = 0; f < numFrames; f++) {
    const real = new Float32Array(W);
    const imag = new Float32Array(W);
    const off = f * H;
    for (let i = 0; i < W; i++) {
      if (off + i < len) real[i] = input[off + i] * hann[i];
    }
    fft(real, imag);
    const mags = new Float32Array(W);
    const phases = new Float32Array(W);
    for (let i = 0; i < W; i++) {
      mags[i] = Math.sqrt(real[i]*real[i] + imag[i]*imag[i]);
      phases[i] = Math.atan2(imag[i], real[i]);
    }
    frames.push({ mags, phases });
  }

  // Synthesize
  const outPhases = new Float32Array(W);
  let prevAnaPhases = new Float32Array(W);
  const omega = new Float32Array(W);
  for (let i = 0; i < W; i++) omega[i] = 2 * Math.PI * H * i / W;

  const numSynthFrames = Math.max(1, Math.floor((outputLen - W) / H) + 1);

  for (let sf = 0; sf < numSynthFrames; sf++) {
    const af = sf / ratio;
    const f0 = Math.floor(af);
    const frac = af - f0;

    const mags = new Float32Array(W);
    const phases = new Float32Array(W);

    if (f0 >= 0 && f0 + 1 < numFrames) {
      for (let i = 0; i < W; i++) {
        mags[i] = frames[f0].mags[i] * (1 - frac) + frames[f0+1].mags[i] * frac;
        phases[i] = frames[f0].phases[i] * (1 - frac) + frames[f0+1].phases[i] * frac;
      }
    } else if (f0 >= 0 && f0 < numFrames) {
      for (let i = 0; i < W; i++) {
        mags[i] = frames[f0].mags[i];
        phases[i] = frames[f0].phases[i];
      }
    } else {
      continue;
    }

    // Phase vocoder propagation
    for (let i = 0; i < W; i++) {
      let delta = phases[i] - prevAnaPhases[i];
      delta -= omega[i];
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      outPhases[i] += omega[i] + delta;
      prevAnaPhases[i] = phases[i];
    }

    // Convert to time domain
    const real = new Float32Array(W);
    const imag = new Float32Array(W);
    for (let i = 0; i < W; i++) {
      real[i] = mags[i] * Math.cos(outPhases[i]);
      imag[i] = mags[i] * Math.sin(outPhases[i]);
    }
    ifft(real, imag);

    // Overlap-add
    const off = sf * H;
    for (let i = 0; i < W; i++) {
      if (off + i < outputLen) out[off + i] += real[i] * hann[i];
    }
  }

  // Normalize
  let max = 0;
  for (let i = 0; i < outputLen; i++) max = Math.max(max, Math.abs(out[i]));
  if (max > 0.95) {
    const scale = 0.95 / max;
    for (let i = 0; i < outputLen; i++) out[i] *= scale;
  }

  const outBuf = audioCtx.createBuffer(ch, outputLen, sr);
  for (let c = 0; c < ch; c++) {
    const cd = outBuf.getChannelData(c);
    for (let i = 0; i < outputLen; i++) cd[i] = out[i];
  }
  return outBuf;
}

// WAV export
export function bufferToWav(buf) {
  const numOfChan = buf.numberOfChannels;
  const length = buf.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const writeString = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + buf.length * numOfChan * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, buf.sampleRate, true);
  view.setUint32(28, buf.sampleRate * 2 * numOfChan, true);
  view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, buf.length * numOfChan * 2, true);
  let offset = 44;
  for (let i = 0; i < buf.length; i++) {
    for (let c = 0; c < numOfChan; c++) {
      let s = Math.max(-1, Math.min(1, buf.getChannelData(c)[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset, s, true);
      offset += 2;
    }
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

// Latency measurement helpers
export function calculateLatencyCompensation(audioCtx) {
  const baseLatency = audioCtx.baseLatency || 0;
  const outputLatency = audioCtx.outputLatency || 0;
  return {
    baseLatency,
    outputLatency,
    total: baseLatency + outputLatency,
    compensation: -(baseLatency + outputLatency)
  };
}

export async function measureLatencyFallback(audioCtx) {
  return new Promise((resolve, reject) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const bufLen = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufLen);
    osc.connect(gain);
    gain.connect(analyser);
    analyser.connect(audioCtx.destination);
    gain.gain.value = 0.001;
    osc.frequency.value = 1000;
    const startTime = audioCtx.currentTime;
    osc.start(startTime);

    let frameCount = 0;
    const maxFrames = 120; // ~2 seconds at 60fps

    const check = () => {
      frameCount++;
      analyser.getByteTimeDomainData(dataArray);
      let max = 0;
      for (let i = 0; i < bufLen; i++) max = Math.max(max, Math.abs(dataArray[i] - 128));
      if (max > 10) {
        const measuredLatency = audioCtx.currentTime - startTime;
        osc.stop();
        gain.disconnect();
        analyser.disconnect();
        resolve(measuredLatency);
      } else if (frameCount >= maxFrames) {
        osc.stop();
        gain.disconnect();
        analyser.disconnect();
        resolve(0); // fallback: no measurable latency
      } else {
        requestAnimationFrame(check);
      }
    };
    requestAnimationFrame(check);
  });
}

// Tap tempo
export function calculateBpmFromTaps(tapTimes) {
  if (tapTimes.length < 2) return null;
  const intervals = [];
  for (let i = 1; i < tapTimes.length; i++) intervals.push(tapTimes[i] - tapTimes[i - 1]);
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  return Math.round(60000 / avg);
}

// Touch gesture helpers
export function detectSwipeDirection(touchStart, touchEnd, threshold = 30) {
  const dx = touchEnd.clientX - touchStart.clientX;
  const dy = touchEnd.clientY - touchStart.clientY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (Math.max(absDx, absDy) < threshold) return null;

  if (absDx > absDy) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'down' : 'up';
  }
}

// Sequencer step probability cycling
export const PROBABILITIES = [1.0, 0.75, 0.5, 0.25, 0];

export function cycleProbability(current) {
  const idx = PROBABILITIES.indexOf(current);
  const nextIdx = (idx + 1) % PROBABILITIES.length;
  return PROBABILITIES[nextIdx];
}

// Song chain helpers
export function getNextSongStep(songChain, currentStep) {
  let nextStep = (currentStep + 1) % SONG_SLOTS;
  let loopCount = 0;
  while (!songChain[nextStep] && loopCount < SONG_SLOTS) {
    nextStep = (nextStep + 1) % SONG_SLOTS;
    loopCount++;
  }
  return songChain[nextStep] ? nextStep : null;
}

export function getFirstSongStep(songChain) {
  for (let i = 0; i < SONG_SLOTS; i++) {
    if (songChain[i]) return i;
  }
  return null;
}

// Pitch rate calculation
export function calculatePlaybackRate(semitones, fine = 0) {
  return Math.pow(2, (semitones + fine / 100) / 12);
}

// Bitcrush parameter calculation
export function calculateBitcrushParams(value) {
  if (value < 0.01) {
    return { bits: 16, normFreq: 1 };
  }
  return {
    bits: Math.max(2, 16 - Math.floor(value * 14)),
    normFreq: Math.max(0.02, 1 - value * 0.98)
  };
}

// Pattern bank operations
export function copyPattern(pattern) {
  return JSON.parse(JSON.stringify(pattern));
}

export function clearPattern() {
  return createEmptyPattern();
}

// Serialize / deserialize for IndexedDB
export function serializePatterns(patterns) {
  return JSON.stringify(patterns);
}

export function deserializePatterns(json) {
  const parsed = JSON.parse(json);
  const result = {};
  for (const bank of BANKS) {
    if (parsed[bank]) {
      result[bank] = normalizePattern(parsed[bank]);
    } else {
      result[bank] = createEmptyPattern();
    }
  }
  return result;
}

export function serializePadSettings(padSettings) {
  return JSON.stringify(padSettings.map(s => ({
    pitchSemitones: s.pitchSemitones,
    pitchFine: s.pitchFine,
    slices: s.slices,
    stretchRatio: s.stretchRatio,
    chopMode: s.chopMode
  })));
}

// IndexedDB helpers
export const DB_NAME = 'TapeLoopDB';
export const DB_VERSION = 2;

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('samples')) db.createObjectStore('samples');
      if (!db.objectStoreNames.contains('patterns')) db.createObjectStore('patterns');
      if (!db.objectStoreNames.contains('songs')) db.createObjectStore('songs');
    };
  });
}

export async function dbPut(store, key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function dbGet(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbDelete(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// State snapshot for crash recovery (lightweight; samples omitted)
export function createStateSnapshot(patterns, songChain, padSettings, bpm, currentBank, masterVol, wobble, bitcrush, filterFreq, reverb, limiter) {
  return {
    version: '0.8.0',
    timestamp: Date.now(),
    patterns: JSON.parse(serializePatterns(patterns)),
    songChain: songChain ? [...songChain] : null,
    padSettings: padSettings ? JSON.parse(serializePadSettings(padSettings)) : null,
    bpm: bpm || 90,
    currentBank: currentBank || 'A',
    effects: {
      masterVol: masterVol !== undefined ? masterVol : 0.8,
      wobble: wobble !== undefined ? wobble : 0,
      bitcrush: bitcrush !== undefined ? bitcrush : 0,
      filter: filterFreq !== undefined ? filterFreq : 8000,
      reverb: reverb !== undefined ? reverb : 0,
      limiter: limiter !== undefined ? limiter : 0.5
    }
  };
}
