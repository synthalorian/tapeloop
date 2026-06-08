# Changelog

All notable changes to TapeLoop are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.9.0] — Release Candidate — 2026-06-08

### Added

- **Comprehensive README** with detailed usage instructions, architecture overview, browser support matrix, keyboard shortcuts, and screenshot placeholders.
- **Demo project** (`demo/`) with four example beat patterns across genres:
  - `boom-bap.json` — Classic hip-hop drum pattern at 88 BPM
  - `house.json` — Four-on-the-floor house beat at 124 BPM
  - `lo-fi-chill.json` — Relaxed lo-fi groove at 75 BPM
  - `techno.json` — Driving techno sequence at 130 BPM
- **Getting-started guide** (`demo/guide/getting-started.md`) with a step-by-step walkthrough for first-time users.
- **Performance benchmark script** (`scripts/benchmark.js`) that measures core operation throughput:
  - Pattern normalize, copy, clear, serialization
  - Song chain traversal
  - Probability cycling and step toggling
  - BPM calculation and schedule-ahead timing
  - FFT / IFFT, phase vocoder, WAV export
  - Touch swipe detection and state snapshots
- **CHANGELOG.md** with release notes for v0.9.0.

### Changed

- Bumped project version to `0.9.0` across `package.json` and the in-app badge in `index.html`.
- README now links to `CHANGELOG.md`, `PLAN.md`, the demo project, and the benchmark script.

### Fixed

- No bug fixes in this release — v0.9.0 is a documentation and release-candidate milestone following the v0.8.0 stability push.

### Known Issues

- Screenshot placeholders in README should be replaced with actual UI captures before v1.0.0.
- Demo patterns ship without audio samples to keep the repository lightweight; users must supply their own samples.

---

## [0.8.0] — Stability — 2026-05-15

### Added

- Memory leak monitoring with `src/memory-monitor.js` and active audio source reference counting.
- Crash recovery system (`src/crash-recovery.js`) that auto-saves lightweight state snapshots every 30 seconds.
- Structured logger (`src/logger.js`) with configurable log levels and an on-screen log viewer.
- Audio error boundary (`src/error-boundary.js`) for defensive decoding and node creation.
- Performance monitor (`src/performance-monitor.js`) tracking audio latency and runtime metrics.
- State migration system (`src/migration.js`) for forward-compatible IndexedDB schema updates.

### Changed

- Refactored test suite to cover new stability modules.
- Improved audio source lifecycle management to prevent disconnected nodes from accumulating.

### Fixed

- Safari/WebKit compatibility issues with AudioContext resume and offline rendering.
- IndexedDB transaction edge cases during large sample import.

---

## [0.7.0] — Pre-release Polish — 2026-04-20

### Added

- Mobile layout optimization with responsive breakpoints for phones and tablets.
- Touch gesture support: swipe pitch changes, long-press selection, pad sliding, and sequencer swipe-to-switch-bank.
- Audio latency measurement and compensation using `baseLatency`, `outputLatency`, and a fallback oscillator probe.
- Comprehensive Vitest test suite covering core, patterns, audio-utils, DOM integration, and stability modules.
- CI/CD build and deploy pipeline to GitHub Pages.
- Safe-area inset support for notched mobile displays.

### Changed

- Transport and sequencer controls resized for touch-friendly minimum 44px targets.
- Pads collapse to 2 columns on small screens and 4 columns on tablets.

### Fixed

- Sequencer horizontal scroll stutter on iOS Safari.
- Visualizer canvas sizing on orientation change.

---

## [0.6.0] — Sampling & Resampling — 2026-03-10

### Added

- Resample master output back into any pad.
- Loop slicing / chop mode with random slice triggers.
- Basic phase-vocoder time-stretching (0.5×–2×).
- Per-pad pitch shift (±24 semitones + fine cents).
- Auto-slice helper for equal segment division.

### Changed

- Pad edit panel expanded to expose new pitch, slice, and stretch controls.

---

## [0.5.0] — Sequencer Power — 2026-02-14

### Added

- Four pattern banks (A/B/C/D) with copy, paste, and clear.
- 16-slot song mode for pattern chaining.
- Per-step probability (100% / 75% / 50% / 25% / 0%).
- Parameter locks for wobble, bitcrush, filter, reverb, and volume.
- Live recording of pad hits into the sequencer grid.

### Changed

- Sequencer UI updated with probability shading and lock indicators.

---

## [0.4.0] — PWA & Polish — 2026-01-22

### Added

- PWA offline support via `sw.js` service worker.
- IndexedDB persistence for samples, patterns, and songs.
- Keyboard shortcut reference overlay (`?`).
- Full-quality WAV export using `OfflineAudioContext`.
- Tap tempo button for rhythm-based BPM entry.
- Master limiter on the output bus.

### Changed

- App shell cached for offline use on first load.

---

## [0.1.0] — Initial Scaffold — 2025-12-01

### Added

- 16 sample pads with click and keyboard triggering.
- Drag-and-drop sample loading.
- Tape wobble, bitcrush, lowpass filter, and reverb effects.
- 16-step sequencer for the first 4 pads.
- Transport controls, BPM, record, and export mix.
- WebGL lo-fi visualizer.

---

[0.9.0]: https://github.com/yourusername/tapeloop/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/yourusername/tapeloop/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/yourusername/tapeloop/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/yourusername/tapeloop/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/yourusername/tapeloop/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/yourusername/tapeloop/compare/v0.1.0...v0.4.0
[0.1.0]: https://github.com/yourusername/tapeloop/releases/tag/v0.1.0
