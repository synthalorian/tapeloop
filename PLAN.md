# TapeLoop Roadmap

## v0.1.0 ✅ — Initial scaffold
- 16 sample pads with click/keyboard triggering
- Drag-and-drop sample loading
- Tape wobble, bitcrush, lowpass filter, reverb
- 16-step sequencer for first 4 pads
- Transport controls, BPM, record, export mix
- WebGL visualizer

## v0.2.0 — Sample editing
- [ ] Drag-and-drop sample assignment per pad
- [ ] Sample trimming / start-end points with waveform display
- [ ] Pattern save / load (JSON export/import)
- [ ] Swing / groove control

## v0.3.0 — FX & MIDI
- [ ] Additional FX: tape saturation, chorus, delay
- [ ] MIDI controller support (Web MIDI API)
- [ ] Multi-track export (stem rendering)

## v0.4.0 — Phase 4: PWA & polish
- [ ] PWA offline support with service worker
- [ ] IndexedDB for sample and pattern persistence
- [ ] Keyboard shortcut reference overlay
- [ ] Export to WAV (full quality, not just 4-second render)
- [ ] BPM tap tempo
- [ ] Master limiter on output

## v0.5.0 — Sequencer power
- [ ] Multiple pattern banks (A/B/C/D)
- [ ] Pattern chaining / song mode
- [ ] Probability per step (chance to trigger)
- [ ] Parameter locks (per-step FX changes)
- [ ] Live recording of pad hits into sequencer

## v0.6.0 — Sampling & resampling
- [ ] Resample master output back into a pad
- [ ] Loop slicing / chop mode
- [ ] Time-stretching (basic phase vocoder)
- [ ] Pitch shift per pad (semitones + fine)

## v0.7.0 — Pre-release polish
- [ ] Mobile layout optimization
- [ ] Touch gesture support
- [ ] Audio latency measurement and compensation
- [ ] Comprehensive test suite
- [ ] CI/CD build and deploy to GitHub Pages

## v0.8.0 — Stability
- [ ] Memory leak audit
- [ ] Large sample handling (100MB+ files)
- [ ] Safari/WebKit compatibility fixes
- [ ] Offline mode stress testing
- [ ] Beta testing feedback integration

## v0.9.0 — Release candidate
- [ ] Final feature freeze
- [ ] Documentation complete
- [ ] Demo project included
- [ ] Performance benchmark
- [ ] Release notes draft

## v1.0.0 — Ship it
- [ ] Tag v1.0.0
- [ ] GitHub release with binaries
- [ ] Announcement post
- [ ] Video tutorial
- [ ] Community feedback channel
