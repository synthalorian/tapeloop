// Test harness: load the real index.html into jsdom, inject an AudioContext
// mock, then execute the app's inline <script> inside the jsdom window.
// Exposes the window so tests can call the app's own functions and inspect DOM.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

class MockParam {
  constructor(v = 0) { this.value = v; }
  setValueAtTime() { return this; }
  linearRampToValueAtTime() { return this; }
  exponentialRampToValueAtTime() { return this; }
}

class MockNode {
  constructor() {
    this.gain = new MockParam(1);
    this.frequency = new MockParam(440);
    this.Q = new MockParam(1);
    this.playbackRate = new MockParam(1);
    this.detune = new MockParam(0);
    this.pan = new MockParam(0);
    this.delayTime = new MockParam(0);
    this.type = '';
    this.buffer = null;
    this.loop = false;
    this.loopStart = 0;
    this.loopEnd = 0;
    this.onended = null;
  }
  connect(node) { return node; }
  disconnect() {}
  start() {}
  stop() {}
}

export class MockAudioContext {
  constructor() {
    this.sampleRate = 44100;
    this.destination = new MockNode();
    this.currentTime = 0;
    this.state = 'running';
  }
  createGain() { return new MockNode(); }
  createBufferSource() { return new MockNode(); }
  createBiquadFilter() { return new MockNode(); }
  createDynamicsCompressor() { return new MockNode(); }
  createDelay() { return new MockNode(); }
  createOscillator() { return new MockNode(); }
  createAnalyser() {
    const n = new MockNode();
    n.fftSize = 2048;
    n.frequencyBinCount = 1024;
    n.smoothingTimeConstant = 0.8;
    n.getByteFrequencyData = (arr) => arr.fill(0);
    n.getByteTimeDomainData = (arr) => arr.fill(128);
    return n;
  }
  createStereoPanner() { return new MockNode(); }
  createBuffer(ch, len, sr) {
    const data = Array.from({ length: ch }, () => new Float32Array(len));
    return {
      numberOfChannels: ch,
      length: len,
      sampleRate: sr,
      duration: len / sr,
      getChannelData: (i) => data[i],
    };
  }
  decodeAudioData() { return Promise.resolve(this.createBuffer(1, 1, this.sampleRate)); }
  resume() { return Promise.resolve(); }
  suspend() { return Promise.resolve(); }
}

let cachedWindow = null;

// Boots the app once and returns the jsdom window with the live app state.
export function bootApp() {
  if (cachedWindow) return cachedWindow;

  const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    url: 'http://localhost/',
  });
  const { window } = dom;

  window.AudioContext = MockAudioContext;
  window.webkitAudioContext = MockAudioContext;
  window.Blob = Blob; // jsdom's Blob lacks .arrayBuffer(); node's has it

  // jsdom has no canvas implementation — stub a 2D context that absorbs
  // all draw calls so the visualizer loop can run headless.
  const ctx2dStub = new Proxy(
    { canvas: null, measureText: () => ({ width: 0 }), getImageData: () => ({ data: new Uint8ClampedArray(4) }) },
    {
      get(target, prop) {
        if (prop in target) return target[prop];
        return () => undefined; // any method call => no-op
      },
      set() { return true; }, // fillStyle etc.
    }
  );
  window.HTMLCanvasElement.prototype.getContext = function () { return ctx2dStub; };

  // Extract and run the app's inline script in the jsdom context.
  const scriptText = window.document.querySelector('script').textContent;
  window.eval(scriptText);

  cachedWindow = window;
  return window;
}

// Fresh boot per test file that needs isolated localStorage/state.
export function freshBoot() {
  cachedWindow = null;
  return bootApp();
}

// Build a fake AudioBuffer the app can encode (no real audio needed).
export function fakeBuffer(channels, frames, sampleRate, fill) {
  const data = Array.from({ length: channels }, (_, c) => {
    const arr = new Float32Array(frames);
    if (typeof fill === 'function') {
      for (let i = 0; i < frames; i++) arr[i] = fill(i, c);
    }
    return arr;
  });
  return {
    numberOfChannels: channels,
    length: frames,
    sampleRate,
    getChannelData: (i) => data[i],
  };
}
