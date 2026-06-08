# 🎛️ TapeLoop

A lo-fi audio sampler and sequencer in the browser. Record loops, apply tape effects, build beats, and connect your MIDI controller.

## Features

- 🎹 **8 sample pads** — click or press `1-8` to trigger
- 🎚️ **16-step sequencer** — toggle steps, set BPM
- 🎛️ **Lo-fi effects** — tape wobble, bitcrush, lowpass filter, delay, chorus, compressor
- 📺 **Visualizer** — retro frequency bars reacting to audio
- 💾 **Record/export** — capture your mix to `.webm`
- 📂 **Drag-and-drop** — drop audio files directly onto pads
- 💾 **Pattern save/load** — save patterns to browser localStorage
- 📤 **Pattern import/export** — share patterns as JSON files
- 🔊 **Export to WAV** — render your pattern or individual pads to `.wav` files
- 🎵 **Tap tempo** — tap to set BPM
- 🎹 **MIDI controller support** — map any MIDI device to pads with MIDI Learn
- 📲 **PWA support** — install as an offline-capable app
- 🚫 **Zero dependencies** — vanilla JS, runs anywhere

## Usage

Open `index.html` in any modern browser. No build step, no server needed.

```bash
firefox index.html
# or
python -m http.server 8080
```

## Controls

| Control | Action |
|---------|--------|
| Click pad / `1-8` | Trigger sample |
| Double-click pad | Load sample via file dialog |
| Drop audio file on pad | Load sample via drag-and-drop |
| ⬇ on pad | Export that pad's sample as WAV |
| Sequencer grid | Toggle steps |
| BPM slider | Set tempo |
| TAP button | Tap to calculate BPM |
| Wobble / Crush / Filter / Resonance knobs | Adjust effects |
| Delay Time / Delay FB / Delay Mix | Slapback/echo effect |
| Chorus Rate / Chorus Depth / Chorus Mix | Subtle pitch modulation |
| Comp Thr / Comp Ratio / Comp Gain | Dynamics compression |
| Record button (`R`) | Capture live mix to `.webm` |
| EXPORT WAV button (`E`) | Render pattern to `.wav` |
| SAVE PATTERN button (`S`) | Save current pattern to localStorage |
| LOAD PATTERN button (`L`) | Load selected pattern |
| EXPORT JSON button | Export selected pattern as JSON file |
| IMPORT JSON button | Import pattern from JSON file |
| 📲 INSTALL APP button | Install TapeLoop as PWA |
| Spacebar | Play / Stop sequencer |

## MIDI Controller Support

TapeLoop supports the Web MIDI API for hardware controller integration.

- **Default mapping**: MIDI notes 36-43 (C2-G2) map to pads 1-8
- **MIDI Learn**: Click a pad to select it, then click **MIDI LEARN** and play a note on your controller to assign it
- **MIDI CC control**: Use CC 74 to control filter cutoff, CC 71 to control filter resonance in real-time
- **MIDI mapping is saved** to browser localStorage automatically
- **Reset Mapping** restores the default C2-G2 mapping
- Gracefully handles browsers without Web MIDI support

## PWA Installation

TapeLoop can be installed as a Progressive Web App for offline use:

1. Open the app in a modern browser (Chrome, Edge, Firefox, Safari)
2. Click the **📲 INSTALL APP** button when it appears, or use the browser's install icon
3. Click "Install TapeLoop" or "Add to Home Screen"
4. The app will cache core files and work offline

Alternatively, serve via HTTPS and the browser will prompt automatically:

```bash
python -m http.server 8080
# Then open https://localhost:8080 (with a local cert) or deploy to any static host
```

The service worker uses a cache-first strategy: core files are cached on first load, and subsequent visits serve from cache for instant startup. Dynamic runtime caching captures additional assets as they're requested.

## Audio Effects Chain

The signal flows through effects in this order:

1. **Compressor** — controls dynamics (threshold, ratio, makeup gain)
2. **Lowpass Filter** — shapes tone with adjustable resonance (100Hz - 5kHz, Q 0-30)
3. **Chorus** — LFO-modulated delay for width and movement, with dry/wet mix
4. **Delay** — feedback echo with adjustable time and dry/wet mix
5. **Bitcrush** — sample rate reduction for lo-fi grit

## Architecture

Pure HTML5 + vanilla JavaScript. Web Audio API for synthesis, Web MIDI API for controller input, Service Workers for offline support.

## Roadmap

- [x] Drag-and-drop sample assignment
- [x] Pattern save/load (localStorage)
- [x] Pattern import/export (JSON files)
- [x] MIDI controller support (note triggers + CC control)
- [x] PWA offline support with install prompt
- [x] Export to WAV (pattern + individual pads)
- [x] Full effects chain (delay, chorus, compressor, filter, bitcrush)
- [ ] Sample trimming / start-end points
- [ ] Flanger / reverb effects
- [ ] Multiple pattern banks / song mode

## License

MIT
