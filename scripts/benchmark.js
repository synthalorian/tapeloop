#!/usr/bin/env node
/**
 * TapeLoop Performance Benchmark — v0.9.0
 *
 * Run with:
 *   node scripts/benchmark.js
 *
 * This script measures the throughput of core pure functions and audio
 * utilities that power the sequencer and audio engine. It runs entirely
 * in Node.js and does not require a browser.
 */

import { performance } from 'node:perf_hooks';

import {
  createEmptyPattern,
  normalizePattern,
  createDefaultPatterns,
  createEmptySongChain,
  autoSlice,
  fft,
  ifft,
  bufferToWav,
  calculateLatencyCompensation,
  calculateBpmFromTaps,
  detectSwipeDirection,
  cycleProbability,
  getNextSongStep,
  getFirstSongStep,
  calculatePlaybackRate,
  calculateBitcrushParams,
  copyPattern,
  clearPattern,
  serializePatterns,
  deserializePatterns,
  serializePadSettings,
  createStateSnapshot
} from '../src/core.js';

import {
  toggleStep,
  nextSongStep,
  calculateBPMFromIntervals,
  scheduleAheadTimeMs
} from '../src/patterns.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtMs(ms) {
  return ms.toFixed(2).padStart(8, ' ');
}

function fmtOps(ms, count) {
  const opsPerMs = count / Math.max(ms, 0.0001);
  return opsPerMs.toFixed(0).padStart(8, ' ');
}

function benchmark(name, fn, iterations = 1000) {
  // Warmup
  for (let i = 0; i < Math.min(100, iterations); i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;

  return { name, elapsed, iterations, opsPerMs: iterations / Math.max(elapsed, 0.0001) };
}

function report(result) {
  console.log(`${result.name.padEnd(40)} ${fmtMs(result.elapsed)} ms   (${fmtOps(result.elapsed, result.iterations)} ops/ms)`);
  return result;
}

// Mock AudioBuffer for functions that need one without a real AudioContext.
function createMockAudioBuffer(channels, length, sampleRate) {
  const channelData = Array.from({ length: channels }, () => new Float32Array(length));
  return {
    numberOfChannels: channels,
    length,
    sampleRate,
    getChannelData(c) {
      return channelData[c];
    }
  };
}

// Minimal OfflineAudioContext mock for phaseVocoder benchmarking.
const mockAudioCtx = {
  sampleRate: 44100,
  createBuffer(channels, length, sr) {
    const channelData = Array.from({ length: channels }, () => new Float32Array(length));
    return {
      numberOfChannels: channels,
      length,
      sampleRate: sr,
      getChannelData(c) {
        return channelData[c];
      }
    };
  }
};

// A tiny inline phase vocoder stub matching the core API so we can benchmark
// the algorithm independent of the full core module load path.
function benchmarkPhaseVocoder(inputBuffer, ratio, audioCtx) {
  const sr = inputBuffer.sampleRate;
  const ch = inputBuffer.numberOfChannels;
  const len = inputBuffer.length;
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
  for (let i = 0; i < W; i++) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (W - 1));
  const numFrames = Math.max(1, Math.floor((len - W) / H) + 1);
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
      mags[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
      phases[i] = Math.atan2(imag[i], real[i]);
    }
    frames.push({ mags, phases });
  }
  const outPhases = new Float32Array(W);
  let prevAnaPhases = new Float32Array(W);
  const omega = new Float32Array(W);
  for (let i = 0; i < W; i++) omega[i] = (2 * Math.PI * H * i) / W;
  const numSynthFrames = Math.max(1, Math.floor((outputLen - W) / H) + 1);
  for (let sf = 0; sf < numSynthFrames; sf++) {
    const af = sf / ratio;
    const f0 = Math.floor(af);
    const frac = af - f0;
    const mags = new Float32Array(W);
    const phases = new Float32Array(W);
    if (f0 >= 0 && f0 + 1 < numFrames) {
      for (let i = 0; i < W; i++) {
        mags[i] = frames[f0].mags[i] * (1 - frac) + frames[f0 + 1].mags[i] * frac;
        phases[i] = frames[f0].phases[i] * (1 - frac) + frames[f0 + 1].phases[i] * frac;
      }
    } else if (f0 >= 0 && f0 < numFrames) {
      for (let i = 0; i < W; i++) {
        mags[i] = frames[f0].mags[i];
        phases[i] = frames[f0].phases[i];
      }
    } else {
      continue;
    }
    for (let i = 0; i < W; i++) {
      let delta = phases[i] - prevAnaPhases[i];
      delta -= omega[i];
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      outPhases[i] += omega[i] + delta;
      prevAnaPhases[i] = phases[i];
    }
    const real = new Float32Array(W);
    const imag = new Float32Array(W);
    for (let i = 0; i < W; i++) {
      real[i] = mags[i] * Math.cos(outPhases[i]);
      imag[i] = mags[i] * Math.sin(outPhases[i]);
    }
    ifft(real, imag);
    const off = sf * H;
    for (let i = 0; i < W; i++) {
      if (off + i < outputLen) out[off + i] += real[i] * hann[i];
    }
  }
  const outBuf = audioCtx.createBuffer(ch, outputLen, sr);
  for (let c = 0; c < ch; c++) {
    const cd = outBuf.getChannelData(c);
    for (let i = 0; i < outputLen; i++) cd[i] = out[i];
  }
  return outBuf;
}

// ─────────────────────────────────────────────────────────────────────────────
// Benchmark suite
// ─────────────────────────────────────────────────────────────────────────────

console.log('');
console.log('TapeLoop Performance Benchmark — v0.9.0');
console.log('========================================');
console.log('');

const results = [];

// Pattern operations
results.push(report(benchmark('Pattern normalize (1000x)', () => {
  const raw = createDefaultPatterns();
  raw.A[0][0] = { active: true };
  normalizePattern(raw.A);
}, 1000)));

results.push(report(benchmark('Song chain traversal (10kx)', () => {
  const chain = createEmptySongChain();
  chain[0] = 'A'; chain[2] = 'B'; chain[5] = 'C';
  getNextSongStep(chain, 0);
}, 10000)));

results.push(report(benchmark('First song step lookup (10kx)', () => {
  const chain = createEmptySongChain();
  chain[3] = 'B';
  getFirstSongStep(chain);
}, 10000)));

results.push(report(benchmark('Pattern copy (10kx)', () => {
  copyPattern(createEmptyPattern());
}, 10000)));

results.push(report(benchmark('Pattern clear (10kx)', () => {
  clearPattern();
}, 10000)));

// Probability / step editing
results.push(report(benchmark('Cycle probability (100kx)', () => {
  cycleProbability(1.0);
}, 100000)));

results.push(report(benchmark('Toggle step (100kx)', () => {
  const p = createEmptyPattern();
  toggleStep(p, 0, 0, null, 'wobble', 0.5);
}, 100000)));

// BPM / timing
results.push(report(benchmark('BPM from taps (100kx)', () => {
  const now = performance.now();
  calculateBpmFromTaps([now, now + 500, now + 1000, now + 1500]);
}, 100000)));

results.push(report(benchmark('Schedule ahead time (100kx)', () => {
  scheduleAheadTimeMs(120);
}, 100000)));

results.push(report(benchmark('Calculate BPM from intervals (100kx)', () => {
  calculateBPMFromIntervals([500, 500, 500, 500]);
}, 100000)));

// Audio math
results.push(report(benchmark('Playback rate calculation (100kx)', () => {
  calculatePlaybackRate(-7, 15);
}, 100000)));

results.push(report(benchmark('Bitcrush params calculation (100kx)', () => {
  calculateBitcrushParams(0.35);
}, 100000)));

// Touch / interaction
results.push(report(benchmark('Swipe detection (100kx)', () => {
  detectSwipeDirection({ clientX: 100, clientY: 100 }, { clientX: 140, clientY: 95 }, 30);
}, 100000)));

// Serialization
results.push(report(benchmark('Serialize patterns (10kx)', () => {
  serializePatterns(createDefaultPatterns());
}, 10000)));

results.push(report(benchmark('Deserialize patterns (10kx)', () => {
  const json = serializePatterns(createDefaultPatterns());
  deserializePatterns(json);
}, 10000)));

results.push(report(benchmark('Pad settings serialize (10kx)', () => {
  const settings = Array.from({ length: 16 }, () => ({
    pitchSemitones: 0, pitchFine: 0, slices: [], stretchRatio: 1, chopMode: false
  }));
  serializePadSettings(settings);
}, 10000)));

// State snapshot
results.push(report(benchmark('Create state snapshot (10kx)', () => {
  createStateSnapshot(
    createDefaultPatterns(),
    createEmptySongChain(),
    Array.from({ length: 16 }, () => ({ pitchSemitones: 0, pitchFine: 0, slices: [], stretchRatio: 1, chopMode: false })),
    90, 'A', 0.8, 0.1, 0.2, 6000, 0.3, 0.5
  );
}, 10000)));

// Auto-slice
results.push(report(benchmark('Auto-slice buffer (100kx)', () => {
  autoSlice({ length: 44100 * 2 }, 8);
}, 100000)));

// FFT / IFFT
results.push(report(benchmark('FFT 2048 samples (1000x)', () => {
  const real = new Float32Array(2048);
  const imag = new Float32Array(2048);
  for (let i = 0; i < 2048; i++) real[i] = Math.sin(i * 0.1);
  fft(real, imag);
}, 1000)));

results.push(report(benchmark('IFFT 2048 samples (1000x)', () => {
  const real = new Float32Array(2048);
  const imag = new Float32Array(2048);
  for (let i = 0; i < 2048; i++) {
    real[i] = Math.sin(i * 0.1);
    imag[i] = Math.cos(i * 0.1);
  }
  ifft(real, imag);
}, 1000)));

// WAV export
results.push(report(benchmark('Buffer to WAV (1000x)', () => {
  const buf = createMockAudioBuffer(2, 44100, 44100);
  for (let c = 0; c < 2; c++) {
    const ch = buf.getChannelData(c);
    for (let i = 0; i < 44100; i++) ch[i] = Math.sin(i * 0.05) * 0.5;
  }
  bufferToWav(buf);
}, 1000)));

// Phase vocoder stub (expensive; run fewer iterations)
results.push(report(benchmark('Phase vocoder mono 0.5s (50x)', () => {
  const buf = createMockAudioBuffer(1, 22050, 44100);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < 22050; i++) ch[i] = Math.sin(i * 0.1);
  benchmarkPhaseVocoder(buf, 1.2, mockAudioCtx);
}, 50)));

// Latency compensation stub (no audioCtx required for calculation)
results.push(report(benchmark('Latency compensation calc (100kx)', () => {
  calculateLatencyCompensation({ baseLatency: 0.01, outputLatency: 0.02 });
}, 100000)));

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log('');
const totalMs = results.reduce((sum, r) => sum + r.elapsed, 0);
const totalOps = results.reduce((sum, r) => sum + r.opsPerMs, 0);
console.log(`Total benchmark time: ${totalMs.toFixed(2)} ms`);
console.log(`Combined throughput:  ${totalOps.toFixed(0)} ops/ms`);
console.log('');
console.log('Benchmark complete.');
