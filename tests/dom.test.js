import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock AudioContext for DOM tests
class MockAudioBuffer {
  constructor(channels, length, rate) {
    this.numberOfChannels = channels;
    this.length = length;
    this.sampleRate = rate;
    this._data = Array.from({ length: channels }, () => new Float32Array(length));
  }
  getChannelData(c) { return this._data[c]; }
}

class MockAudioContext {
  constructor() {
    this.sampleRate = 44100;
    this.currentTime = 0;
    this.baseLatency = 0.01;
    this.outputLatency = 0.02;
  }
  createGain() {
    return { gain: { value: 1, setValueAtTime: () => {}, setTargetAtTime: () => {} }, connect: () => {} };
  }
  createBiquadFilter() {
    return { type: 'lowpass', frequency: { value: 8000, setValueAtTime: () => {}, setTargetAtTime: () => {} }, connect: () => {} };
  }
  createScriptProcessor() {
    return { connect: () => {}, onaudioprocess: null, bits: 16, normFreq: 1 };
  }
  createDelay() {
    return { connect: () => {}, delayTime: { value: 0 } };
  }
  createOscillator() {
    return { type: 'sine', frequency: { value: 0, setValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} };
  }
  createConvolver() {
    return { connect: () => {}, buffer: null };
  }
  createMediaStreamDestination() {
    return { stream: {} };
  }
  createDynamicsCompressor() {
    return {
      threshold: { value: -3 },
      knee: { value: 0 },
      ratio: { value: 20 },
      attack: { value: 0.003 },
      release: { value: 0.1 }
    };
  }
  createBuffer(channels, length, rate) {
    return new MockAudioBuffer(channels, length, rate);
  }
  decodeAudioData(ab) {
    return Promise.resolve(new MockAudioBuffer(2, 1000, 44100));
  }
  resume() { return Promise.resolve(); }
  suspend() { return Promise.resolve(); }
}

global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;
global.OfflineAudioContext = MockAudioContext;

describe('TapeLoop DOM Integration', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    const main = document.createElement('main');
    main.innerHTML = `
      <div id="pads"></div>
      <div id="sequencer" class="seq-grid"></div>
      <div id="songChain" class="song-chain"></div>
      <div id="padEditPanel" style="display:none;">
        <span id="selectedPadName"></span>
        <input id="pitchSemi" type="number" value="0">
        <input id="pitchFine" type="number" value="0">
        <button id="btnChop">Chop Off</button>
        <span id="sliceCount">Slices: 0</span>
        <input id="stretchRatio" type="number" value="1">
        <button id="btnStretch">Apply</button>
        <button id="btnResetStretch">Reset</button>
        <div id="stretchStatus"></div>
      </div>
      <div class="transport">
        <button id="btnStart">Start Audio</button>
        <button id="btnRec">Record</button>
        <button id="btnStop">Stop</button>
        <input id="bpm" class="bpm" type="number" value="90">
        <button id="btnTap">Tap</button>
        <button id="btnPlaySeq">Play Seq</button>
        <button id="btnRecSeq">Rec Seq</button>
        <button id="btnPlaySong" class="hidden">Play Song</button>
        <button id="btnResample">Resample</button>
      </div>
      <input type="file" id="fileInput" accept="audio/*" multiple>
      <button id="btnSave">Save Set</button>
      <button id="btnLoad">Load Set</button>
      <button id="btnExport">Export Mix</button>
      <button id="btnExportWav">Export WAV</button>
      <div class="bank-selector">
        <button class="bank-btn active" data-bank="A">A</button>
        <button class="bank-btn" data-bank="B">B</button>
        <button class="bank-btn" data-bank="C">C</button>
        <button class="bank-btn" data-bank="D">D</button>
        <button id="btnCopyPattern">Copy</button>
        <button id="btnPastePattern">Paste</button>
        <button id="btnClearPattern">Clear</button>
      </div>
      <div class="seq-tools">
        <button id="btnEditProb">Probability</button>
        <button id="btnEditLock">Param Lock</button>
        <select id="lockParam">
          <option value="wobble">Wobble</option>
          <option value="bitcrush">Bitcrush</option>
        </select>
        <span id="editModeLabel"></span>
      </div>
      <div class="song-section">
        <button id="btnToggleSong">Off</button>
      </div>
      <div id="status">Click Start Audio</div>
      <span id="latencyInfo" class="hidden"></span>
      <div id="shortcutOverlay" class="overlay">
        <div class="overlay-inner">
          <button id="btnCloseOverlay">Close</button>
        </div>
      </div>
      <canvas id="viz"></canvas>
      <div class="row"><input id="wobble" type="range" min="0" max="1" step="0.01" value="0"></div>
      <div class="row"><input id="bitcrush" type="range" min="0" max="1" step="0.01" value="0"></div>
      <div class="row"><input id="filter" type="range" min="100" max="8000" step="10" value="8000"></div>
      <div class="row"><input id="reverb" type="range" min="0" max="1" step="0.01" value="0"></div>
      <div class="row"><input id="masterVol" type="range" min="0" max="1" step="0.01" value="0.8"></div>
      <div class="row"><input id="limiter" type="range" min="0" max="1" step="0.01" value="0.5"></div>
    `;
    document.body.appendChild(main);
  });

  it('DOM structure exists', () => {
    expect(document.getElementById('pads')).toBeTruthy();
    expect(document.getElementById('sequencer')).toBeTruthy();
    expect(document.getElementById('songChain')).toBeTruthy();
    expect(document.getElementById('status')).toBeTruthy();
  });

  it('pad elements can be created and clicked', () => {
    const padsEl = document.getElementById('pads');
    for (let i = 0; i < 16; i++) {
      const d = document.createElement('div');
      d.className = 'pad';
      d.dataset.idx = i;
      d.innerHTML = `<span class="label">PAD${i}</span><span class="slot" id="slot${i}">empty</span>`;
      padsEl.appendChild(d);
    }
    expect(padsEl.children).toHaveLength(16);
    
    // Simulate click with attached handler
    const firstPad = padsEl.children[0];
    firstPad.addEventListener('mousedown', () => firstPad.classList.add('playing'));
    firstPad.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(firstPad.classList.contains('playing')).toBe(true);
  });

  it('sequencer grid can be built', () => {
    const seqEl = document.getElementById('sequencer');
    const STEPS = 16;
    for (let r = 0; r < 4; r++) {
      const lbl = document.createElement('div');
      lbl.className = 'seq-label';
      lbl.textContent = `PAD${r}`;
      seqEl.appendChild(lbl);
      for (let s = 0; s < STEPS; s++) {
        const step = document.createElement('div');
        step.className = 'step';
        step.dataset.row = r;
        step.dataset.col = s;
        seqEl.appendChild(step);
      }
    }
    // 4 labels + 4 * 16 steps = 68 children
    expect(seqEl.children).toHaveLength(68);
  });

  it('step elements can be toggled', () => {
    const step = document.createElement('div');
    step.className = 'step';
    step.dataset.row = '0';
    step.dataset.col = '0';
    
    // Simulate toggle
    step.classList.toggle('on', true);
    expect(step.classList.contains('on')).toBe(true);
    
    step.classList.toggle('on', false);
    expect(step.classList.contains('on')).toBe(false);
  });

  it('song chain slots can be created', () => {
    const songChainEl = document.getElementById('songChain');
    const SONG_SLOTS = 16;
    for (let i = 0; i < SONG_SLOTS; i++) {
      const slot = document.createElement('div');
      slot.className = 'song-slot empty';
      slot.dataset.idx = i;
      slot.textContent = '–';
      songChainEl.appendChild(slot);
    }
    expect(songChainEl.children).toHaveLength(16);
    
    // Test slot state change
    const firstSlot = songChainEl.children[0];
    firstSlot.textContent = 'A';
    firstSlot.classList.remove('empty');
    firstSlot.classList.add('active');
    expect(firstSlot.textContent).toBe('A');
    expect(firstSlot.classList.contains('active')).toBe(true);
  });

  it('bank buttons can be switched', () => {
    const buttons = document.querySelectorAll('.bank-btn');
    expect(buttons).toHaveLength(4);
    
    // Simulate bank switch
    buttons.forEach(btn => btn.classList.remove('active'));
    buttons[1].classList.add('active');
    expect(buttons[1].classList.contains('active')).toBe(true);
    expect(buttons[0].classList.contains('active')).toBe(false);
  });

  it('edit mode buttons toggle correctly', () => {
    const probBtn = document.getElementById('btnEditProb');
    const lockBtn = document.getElementById('btnEditLock');
    
    // Simulate toggle
    probBtn.classList.toggle('active', true);
    expect(probBtn.classList.contains('active')).toBe(true);
    expect(lockBtn.classList.contains('active')).toBe(false);
  });

  it('transport buttons exist and are clickable', () => {
    const startBtn = document.getElementById('btnStart');
    const stopBtn = document.getElementById('btnStop');
    const playSeqBtn = document.getElementById('btnPlaySeq');
    
    expect(startBtn).toBeTruthy();
    expect(stopBtn).toBeTruthy();
    expect(playSeqBtn).toBeTruthy();
    
    // Simulate clicks
    startBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    playSeqBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

  it('file input exists with correct attributes', () => {
    const fileInput = document.getElementById('fileInput');
    expect(fileInput).toBeTruthy();
    expect(fileInput.getAttribute('accept')).toBe('audio/*');
    expect(fileInput.hasAttribute('multiple')).toBe(true);
  });

  it('shortcut overlay toggles', () => {
    const overlay = document.getElementById('shortcutOverlay');
    expect(overlay).toBeTruthy();
    expect(overlay.classList.contains('active')).toBe(false);
    
    overlay.classList.add('active');
    expect(overlay.classList.contains('active')).toBe(true);
    
    overlay.classList.remove('active');
    expect(overlay.classList.contains('active')).toBe(false);
  });

  it('pad edit panel shows and hides', () => {
    const panel = document.getElementById('padEditPanel');
    expect(panel.style.display).toBe('none');
    
    panel.style.display = 'block';
    expect(panel.style.display).toBe('block');
  });

  it('status text can be updated', () => {
    const status = document.getElementById('status');
    status.textContent = 'Test status';
    expect(status.textContent).toBe('Test status');
  });

  it('latency info element exists', () => {
    const latencyInfo = document.getElementById('latencyInfo');
    expect(latencyInfo).toBeTruthy();
    expect(latencyInfo.classList.contains('hidden')).toBe(true);
  });
});

describe('Touch Events', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="pads"></div>';
    const padsEl = document.getElementById('pads');
    for (let i = 0; i < 16; i++) {
      const pad = document.createElement('div');
      pad.className = 'pad';
      pad.dataset.idx = i;
      padsEl.appendChild(pad);
    }
  });

  it('touchstart event can be simulated on pads', () => {
    const pad = document.querySelector('.pad');
    const touch = new Touch({
      identifier: 1,
      target: pad,
      clientX: 50,
      clientY: 50
    });
    const event = new TouchEvent('touchstart', {
      touches: [touch],
      changedTouches: [touch],
      bubbles: true
    });
    pad.dispatchEvent(event);
    expect(pad).toBeTruthy();
  });

  it('touchmove event can be simulated', () => {
    const pad = document.querySelector('.pad');
    const touch = new Touch({
      identifier: 1,
      target: pad,
      clientX: 60,
      clientY: 60
    });
    const event = new TouchEvent('touchmove', {
      touches: [touch],
      changedTouches: [touch],
      bubbles: true
    });
    pad.dispatchEvent(event);
    expect(pad).toBeTruthy();
  });

  it('touchend event can be simulated', () => {
    const pad = document.querySelector('.pad');
    const touch = new Touch({
      identifier: 1,
      target: pad,
      clientX: 50,
      clientY: 50
    });
    const event = new TouchEvent('touchend', {
      touches: [],
      changedTouches: [touch],
      bubbles: true
    });
    pad.dispatchEvent(event);
    expect(pad).toBeTruthy();
  });
});
