// Test setup: mock browser APIs that might not exist in jsdom

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock URL.createObjectURL / revokeObjectURL
global.URL.createObjectURL = () => 'blob:mock';
global.URL.revokeObjectURL = () => {};

// Mock MediaRecorder
global.MediaRecorder = class MockMediaRecorder {
  constructor(stream) {
    this.stream = stream;
    this.state = 'inactive';
  }
  start() { this.state = 'recording'; }
  stop() { 
    this.state = 'inactive';
    if (this.ondataavailable) {
      this.ondataavailable({ data: { size: 100 } });
    }
    if (this.onstop) {
      this.onstop();
    }
  }
  pause() { this.state = 'paused'; }
  resume() { this.state = 'recording'; }
};

import { vi } from 'vitest';

// Mock localStorage for jsdom environment
const localStorageMock = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = String(value); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

vi.stubGlobal('localStorage', localStorageMock);

// Mock navigator.serviceWorker
global.navigator = global.navigator || {};
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: {
    register: () => Promise.resolve({})
  },
  writable: true,
  configurable: true
});

// Mock WebGL context
global.WebGLRenderingContext = class MockWebGLRenderingContext {
  constructor() {
    this.COLOR_BUFFER_BIT = 0x00004000;
    this.TRIANGLES = 0x0004;
    this.ARRAY_BUFFER = 0x8892;
    this.STATIC_DRAW = 0x88E4;
    this.FLOAT = 0x1406;
    this.VERTEX_SHADER = 0x8B31;
    this.FRAGMENT_SHADER = 0x8B30;
  }
  createShader() { return {}; }
  shaderSource() {}
  compileShader() {}
  getShaderParameter() { return true; }
  getShaderInfoLog() { return ''; }
  deleteShader() {}
  createProgram() { return {}; }
  attachShader() {}
  linkProgram() {}
  getProgramParameter() { return true; }
  getProgramInfoLog() { return ''; }
  useProgram() {}
  createBuffer() { return {}; }
  bindBuffer() {}
  bufferData() {}
  getAttribLocation() { return 0; }
  enableVertexAttribArray() {}
  vertexAttribPointer() {}
  getUniformLocation() { return {}; }
  uniform1f() {}
  uniform2f() {}
  clearColor() {}
  clear() {}
  drawArrays() {}
  viewport() {}
};

global.Touch = class MockTouch {
  constructor(init) {
    this.identifier = init.identifier;
    this.target = init.target;
    this.clientX = init.clientX || 0;
    this.clientY = init.clientY || 0;
    this.pageX = init.pageX || this.clientX;
    this.pageY = init.pageY || this.clientY;
    this.screenX = init.screenX || this.clientX;
    this.screenY = init.screenY || this.clientY;
  }
};

global.TouchEvent = class MockTouchEvent extends Event {
  constructor(type, init = {}) {
    super(type, init);
    this.touches = init.touches || [];
    this.changedTouches = init.changedTouches || [];
    this.targetTouches = init.targetTouches || [];
  }
};

// Mock canvas getContext
HTMLCanvasElement.prototype.getContext = function(type) {
  if (type === 'webgl' || type === 'experimental-webgl') {
    return new global.WebGLRenderingContext();
  }
  return null;
};
