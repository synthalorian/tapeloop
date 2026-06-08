# TapeLoop

> A browser-based lo-fi audio sampler / sequencer inspired by the SP-404 and Tascam Portastudio aesthetic.

[![Version](https://img.shields.io/badge/version-0.9.0-blue)](./CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**No build tools. No frameworks. No install.** Open `index.html` in any modern browser and start making beats.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Screenshots](#screenshots)
- [Usage](#usage)
  - [Loading Samples](#loading-samples)
  - [Playing Pads](#playing-pads)
  - [Using the Sequencer](#using-the-sequencer)
  - [Pattern Banks & Song Mode](#pattern-banks--song-mode)
  - [Effects](#effects)
  - [Pad Editing](#pad-editing)
  - [Recording & Export](#recording--export)
  - [Offline PWA](#offline-pwa)
- [Demo Project](#demo-project)
- [Performance Benchmarks](#performance-benchmarks)
- [Architecture](#architecture)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Browser Support](#browser-support)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **16 velocity-sensitive sample pads** triggered by click, touch, or keyboard
- **Drag-and-drop / file picker** sample loading (WAV, MP3, OGG, FLAC)
- **Tape wobble** — LFO-driven pitch drift for warbly cassette character
- **Bitcrush** — sample-rate and bit-depth reduction via ScriptProcessor
- **Lowpass filter** — warm analog-style cutoff sweep
- **Reverb** — generated impulse-response convolver with wet/dry mix
- **16-step sequencer** with per-step probability and parameter locks
- **4 pattern banks (A/B/C/D)** plus 16-slot song chaining
- **Transport controls** — start/stop, BPM (40–200), record, tap tempo
- **Live sequencer recording** — perform pad hits directly into the grid
- **Pad editing** — pitch shift (±24 semitones + fine), auto-slice, chop mode, time-stretch
- **Resampling** — capture master output back into any pad
- **WebGL visualizer** — retro scanline/noise background reacting to effects
- **Keyboard shortcuts** — full performance control without touching the mouse
- **PWA offline support** — works offline after first load via service worker
- **IndexedDB persistence** — save and restore sample sets, patterns, and songs
- **Full WAV export** — high-quality offline render to WAV (configurable length)
- **WebM mix export** — quick 4-second performance capture
- **Tap tempo** — set BPM by clicking in rhythm
- **Master limiter** — prevents clipping on the master output
- **Latency compensation** — automatic audio latency measurement and adjustment
- **Touch gesture support** — swipe, long-press, and slide optimized for mobile
- **Crash recovery** — auto-saves state every 30 seconds
- **Memory leak monitoring** — tracks active audio sources and warns on growth

---

## Quick Start

1. Clone or download this repository.
2. Open `index.html` in Chrome, Firefox, Edge, or Safari.
3. Click **Start Audio** to unlock the Web Audio context.
4. Load samples via the file picker or drag audio files onto the page.
5. Click pads to play samples, or toggle steps in the sequencer grid.
6. Press **Play Seq** to start the sequencer.

```bash
git clone https://github.com/yourusername/tapeloop.git
cd tapeloop
# Then open index.html in your browser
```

---

## Screenshots

> Placeholder screenshots — replace these with actual captures before publishing.

### Main Interface
```
┌────────────────────────────────────────────────────────────┐
│  TAPELOOP    Lo-Fi Sampler / Sequencer — v0.9.0   [Start]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                  [WebGL Visualizer]                        │
│                                                            │
├──────────────────────────┬─────────────────────────────────┤
│  [KICK] [SNARE] [CLAP]   │  Effects                        │
│  [HAT]  [BASS]  [KEYS]   │  Wobble  [──────────]           │
│  [PAD]  [FX]    [PERC]   │  Bitcrush[──●──────]           │
│  [VOX]  [BELL]  [NOISE]  │  Filter  [────●────]           │
│                          │  Reverb  [──────●──]           │
│  Load sample [Choose]    │  Volume  [────●────]           │
│  [Save] [Load] [Export]  │  Limiter [────●────]           │
│                          ├─────────────────────────────────┤
│  Sequencer grid (16x4)   │  Pad Edit · Song Mode           │
└──────────────────────────┴─────────────────────────────────┘
```

### Sequencer View
![Sequencer Placeholder](./docs/screenshots/sequencer-placeholder.png)
*16-step sequencer with probability shading and parameter lock indicators.*

### Effects Panel
![Effects Placeholder](./docs/screenshots/effects-placeholder.png)
*Real-time tape wobble, bitcrush, filter, reverb, and master limiter.*

### Mobile Layout
![Mobile Placeholder](./docs/screenshots/mobile-placeholder.png)
*Touch-optimized interface for phones and tablets.*

---

## Usage

### Loading Samples

Each of the 16 pads can hold one sample. There are two ways to load:

1. **File picker** — Click the **Load sample** input and select one or more audio files.
2. **Drag and drop** — Drag audio files from your computer directly onto the page. Files are assigned to pads in order.

Supported formats: `wav`, `mp3`, `ogg`, `flac`, `m4a`, `webm`.

### Playing Pads

- **Mouse:** Click a pad.
- **Keyboard:** Press `1`–`8` to trigger pads 1–8.
- **Touch:** Tap a pad on mobile. Slide your finger across pads to trigger them in succession.
- **Slice trigger:** Press `Q`–`I` to trigger a random slice on pads 1–8 when chop mode is active.

Hold `Shift` and click a pad to select it for editing without triggering it.

### Using the Sequencer

The bottom half of the screen shows a 16×4 grid. Each row corresponds to pads 1–4, and each column is a 16th-note step.

- Click a step to toggle it on/off.
- The white outline shows the current playhead position.
- Use the **Probability** edit mode to set per-step chance (100% → 75% → 50% → 25% → 0%).
- Use the **Param Lock** edit mode to lock effect values to individual steps.

Start/stop the sequencer with the **Play Seq** button or by pressing `Space`.

### Pattern Banks & Song Mode

Switch between pattern banks **A**, **B**, **C**, and **D** using the bank selector. Each bank holds an independent 16-step pattern.

**Song Mode** lets you chain patterns into a longer arrangement:

1. Click **Off** next to **Song Mode** to turn it on.
2. Click the 16 song slots to cycle through `– → A → B → C → D → –`.
3. Press **Play Song** to play through the chain in order.

You can also copy, paste, and clear patterns using the buttons above the sequencer grid.

### Effects

| Effect | Control | Description |
|--------|---------|-------------|
| **Wobble** | 0–1 | LFO rate controlling pitch drift / tape flutter |
| **Bitcrush** | 0–1 | Bit-depth and sample-rate reduction |
| **Filter** | 100Hz–8kHz | Lowpass filter cutoff frequency |
| **Reverb** | 0–1 | Wet/dry mix of generated impulse reverb |
| **Volume** | 0–1 | Master output gain |
| **Limiter** | 0–1 | Dynamics compressor threshold acting as limiter |

### Pad Editing

Select a pad (Shift + click) to open the **Pad Edit** panel:

- **Pitch (st / fine)** — Shift playback pitch by semitones and cents.
- **Chop** — Toggle chop mode to loop between slice points.
- **Auto-slice** — Divide the sample into 8 equal slices automatically.
- **Stretch** — Time-stretch the sample using a basic phase vocoder (0.5×–2×).

On touch devices:
- **Swipe up/down** on a pad to nudge pitch by ±1 semitone.
- **Long press** a pad to focus it for editing.

### Recording & Export

- **Record** — Capture the master output to a WebM file in real time.
- **Export Mix** — Automatically records a 4-second performance clip.
- **Export WAV** — Render a high-quality WAV file of any length using OfflineAudioContext.
- **Save Set / Load Set** — Persist samples, patterns, and settings to IndexedDB.
- **Resample** — Record the master output for a chosen duration directly back into a pad for resampling.

### Offline PWA

TapeLoop works offline after the first load:

1. Open the app in a supported browser.
2. The service worker (`sw.js`) automatically caches the app shell.
3. Add the page to your home screen for a standalone app experience.

---

## Demo Project

A set of example patterns and a guide are included in the [`demo/`](./demo/) directory.

```bash
# Load a demo pattern after opening the app
demo/
├── README.md
├── patterns/
│   ├── boom-bap.json       # Classic hip-hop drum pattern
│   ├── house.json          # Four-on-the-floor house beat
│   ├── lo-fi-chill.json    # Relaxed lo-fi groove
│   └── techno.json         # Driving techno sequence
└── guide/
    └── getting-started.md  # Step-by-step demo walkthrough
```

To try a demo pattern:

1. Open `index.html`.
2. Load your own drum samples (or use the synthesized test tones).
3. Click **Load Set** and choose one of the `.json` files from `demo/patterns/`.

Each demo pattern includes:
- Pre-programmed sequencer steps for pads 1–4
- Suggested BPM
- Recommended effect starting points
- Parameter locks for fills and variation

---

## Performance Benchmarks

A standalone benchmark script is provided in [`scripts/benchmark.js`](./scripts/benchmark.js). Run it with Node.js to measure core operation throughput:

```bash
node scripts/benchmark.js
```

Example output:

```
TapeLoop Performance Benchmark — v0.9.0
========================================
Pattern normalize (1000x):      2.34 ms
Song chain traversal:           0.08 ms
BPM calculation (16 taps):      0.01 ms
Playback rate calculation:      0.02 ms
Bitcrush params calculation:    0.03 ms
FFT (2048 samples, 100x):      45.12 ms
Phase vocoder stub (mono):      8.91 ms
State snapshot creation:        0.15 ms
Serialization round-trip:       1.23 ms
Memory baseline:                4.2 MB

Overall score:                  1247 ops/ms
```

Benchmarks are useful for:
- Validating performance on new hardware
- Detecting regressions between releases
- Tuning sequencer lookahead timing

---

## Architecture

TapeLoop is intentionally built as a **zero-dependency, single-page application**.

```
index.html
├── HTML / CSS — all UI markup and styling
├── Inline module script — main application state and audio graph
├── src/core.js — pure functions, serialization, IndexedDB helpers
├── src/patterns.js — sequencer pattern logic
├── src/audio-utils.js — audio buffer utilities
├── src/logger.js — structured logging
├── src/error-boundary.js — defensive audio error handling
├── src/crash-recovery.js — auto-save / restore
├── src/migration.js — schema migration
├── src/performance-monitor.js — runtime metrics
├── src/memory-monitor.js — leak detection
├── sw.js — service worker for offline support
└── tests/ — Vitest test suite
```

### Audio Graph

```
Source → MasterGain → Lowpass → Bitcrusher → WobbleDelay → ConvolverReverb ─┬─> Limiter → Destination
                                                                            │
                                                                            └──> Recorder (WebM)
```

### Sequencer Engine

The sequencer uses a **lookahead scheduler** similar to Chris Wilson’s Web Audio metronome:

- `lookahead = 25ms` — how often the scheduler wakes up
- `scheduleAheadTime = 0.1s` — how far ahead notes are scheduled onto the audio thread
- `latencyCompensation` — subtracts measured device latency from scheduling time

This combination provides tight, jitter-free timing while keeping the UI responsive.

### State Persistence

IndexedDB (`TapeLoopDB`) stores three object stores:

- `samples` — `ArrayBuffer` of loaded sample data keyed by pad index
- `patterns` — serialized pattern banks
- `songs` — serialized song chains and pad settings

A lightweight state snapshot is also saved to `localStorage` every 30 seconds for crash recovery.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1`–`8` | Trigger pads 1–8 |
| `Shift` + `1`–`8` | Select pads 1–8 for editing |
| `Q`–`I` | Trigger random slice on pads 1–8 (chop mode) |
| `Space` | Toggle sequencer start/stop |
| `R` | Toggle live sequencer recording |
| `?` | Show / hide keyboard shortcut overlay |
| `Drag file` | Load sample onto page |

---

## Browser Support

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome / Edge | ✅ Supported | Best performance and feature support |
| Firefox | ✅ Supported | Fully functional |
| Safari | ✅ Supported | May require user gesture for AudioContext |
| Mobile Chrome | ✅ Supported | Touch gestures optimized |
| Mobile Safari | ✅ Supported | Add to Home Screen for PWA experience |

Required APIs: Web Audio, WebGL, IndexedDB, Service Worker.

---

## Roadmap

See [`PLAN.md`](./PLAN.md) for the full development roadmap.

Highlights:

- [x] **v0.1.0** — Initial scaffold with pads, FX, and sequencer
- [x] **v0.4.0** — PWA offline support, IndexedDB persistence, WAV export, tap tempo
- [x] **v0.5.0** — Multiple pattern banks, song mode, probability, parameter locks, live recording
- [x] **v0.6.0** — Resampling, loop slicing, time-stretching, pitch shift
- [x] **v0.7.0** — Mobile layout, touch gestures, latency compensation, test suite, CI/CD
- [x] **v0.8.0** — Stability: memory leak audit, large sample handling, Safari fixes, offline stress testing
- [x] **v0.9.0** — Release candidate: documentation, demo project, benchmarks, release notes
- [ ] **v1.0.0** — Ship it: tag, GitHub release, binaries, announcement

---

## Contributing

Contributions are welcome. Because the project is intentionally framework-free, please keep changes vanilla and self-contained.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-thing`.
3. Write or update tests in `tests/`.
4. Run the test suite: `npm test`.
5. Open a pull request with a clear description.

Please ensure the benchmark script still passes and the app continues to work offline.

---

## License

MIT — use it, break it, sample it.

```
Copyright (c) TapeLoop Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

