# TapeLoop

A browser-based lo-fi audio sampler / sequencer inspired by the SP-404 and Tascam Portastudio aesthetic. No build tools, no frameworks — open `index.html` in any modern browser and start making beats.

## Features

- **16 sample pads** with click or keyboard (1-8) triggering
- **Drag-and-drop / file picker** sample loading (WAV, MP3, OGG)
- **Tape wobble** — LFO-driven pitch drift for that warbly cassette feel
- **Bitcrush** — sample-rate / bit-depth reduction via ScriptProcessor
- **Lowpass filter** — warm analog-style cutoff
- **Reverb** — generated impulse-response convolver with wet/dry mix
- **16-step sequencer** for the first 4 pads with on-screen toggle grid
- **Transport controls** — start/stop, BPM (40-200), record, export mix
- **WebGL visualizer** — retro scanline / noise background that reacts to wobble & bitcrush
- **Keyboard shortcuts** — `1-8` trigger pads, `Space` toggles sequencer, `?` shows reference
- **PWA offline support** — works offline after first load via service worker
- **IndexedDB persistence** — save and reload sample sets and patterns
- **Full WAV export** — high-quality offline render to WAV (configurable length)
- **Tap tempo** — click Tap button to set BPM by rhythm
- **Master limiter** — prevents clipping on the master output

## How to Use

1. Open `index.html` in Chrome, Firefox, Edge, or Safari.
2. Click **Start Audio** to unlock the Web Audio context.
3. Load samples via the file picker or drag audio files onto the page.
4. Click pads to play samples, or toggle steps in the sequencer grid.
5. Adjust wobble, bitcrush, filter, reverb, master volume, and limiter in the sidebar.
6. Hit **Record** to capture a live performance, **Export Mix** for a 4-second webm, or **Export WAV** for full-quality render.
7. Press **Save Set** to persist samples and patterns to browser storage; **Load Set** to restore.
8. Use **Tap** to set BPM by clicking in rhythm.

## Architecture

- Single-file `index.html` containing HTML, CSS, and vanilla JS
- Web Audio API graph:
  `Source → MasterGain → Lowpass → Bitcrusher → WobbleDelay → ConvolverReverb → Limiter → Destination`
- Sequencer uses a lookahead scheduler (similar to Chris Wilson's metronome) for tight timing
- WebGL fragment shader generates a lo-fi CRT/tape aesthetic in real time
- IndexedDB (`TapeLoopDB`) stores samples and patterns locally
- Service worker enables offline caching of the app shell

## Roadmap

- [x] PWA offline support
- [ ] Drag-and-drop sample assignment per pad
- [ ] Sample trimming / start-end points
- [ ] Pattern save / load (JSON export)
- [ ] Swing / groove control
- [ ] Additional FX: tape saturation, chorus, delay
- [ ] MIDI controller support (Web MIDI API)
- [ ] Multi-track export (stem rendering)

## License

MIT — use it, break it, sample it.
