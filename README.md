# 🎛️ TapeLoop

A lo-fi audio sampler and sequencer in the browser. Record loops, apply tape effects, build beats, and connect your MIDI controller.

## Features

- 🎹 **8 sample pads** — click or press `1-8` to trigger
- 🎚️ **Dual 16-step sequencers** — two independent tracks with mute and solo, synced playback
- 🎛️ **Lo-fi effects** — tape wobble, bitcrush, lowpass filter, delay, chorus, flanger, reverb, compressor
- ✂️ **Sample trimming** — set start/end points per pad with visual indicators
- 🏦 **Pattern banks** — 4 banks (A/B/C/D) with independent sequencer patterns
- 🎵 **Song mode** — chain patterns from different banks into sequences
- 📺 **Visualizer** — retro frequency bars reacting to audio
- 💾 **Record/export** — capture your mix to `.webm`
- 📂 **Drag-and-drop** — drop audio files directly onto pads
- 💾 **Pattern save/load** — save patterns to browser localStorage
- 📤 **Pattern import/export** — share patterns as JSON files
- 🔊 **Export to WAV** — render your pattern or individual pads to `.wav` files
- 🎵 **Tap tempo** — tap to set BPM
- 🎹 **MIDI controller support** — map any MIDI device to pads with MIDI Learn
- 📲 **PWA support** — install as an offline-capable app
- 🚫 **Zero runtime dependencies** — vanilla JS, runs anywhere

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
| Sequencer grid (Track 1 / Track 2) | Toggle steps per track |
| MUTE / SOLO buttons | Mute or solo each sequencer track |
| BPM slider | Set tempo |
| TAP button | Tap to calculate BPM |
| Wobble / Crush / Filter / Resonance knobs | Adjust effects |
| Delay Time / Delay FB / Delay Mix | Slapback/echo effect |
| Chorus Rate / Chorus Depth / Chorus Mix | Subtle pitch modulation |
| Flanger Rate / Depth / FB / Mix | Jet-like sweeping effect |
| Reverb Size / Damp / Mix | Ambient space simulation |
| Comp Thr / Comp Ratio / Comp Gain | Dynamics compression |
| Pad 1/2 Start / End sliders | Trim sample playback range |
| Bank A/B/C/D buttons | Switch between pattern banks |
| 🎵 SONG button | Toggle song mode |
| + ADD CURRENT | Add current bank to song chain |
| CLEAR | Clear song chain |
| SAVE/LOAD SONG | Persist song arrangements |
| Record button (`R`) | Capture live mix to `.webm` |
| EXPORT WAV button (`E`) | Render pattern to `.wav` |
| SAVE PATTERN button (`S`) | Save current pattern to localStorage |
| LOAD PATTERN button (`L`) | Load selected pattern |
| EXPORT JSON button | Export selected pattern as JSON file |
| IMPORT JSON button | Import pattern from JSON file |
| 📲 INSTALL APP button | Install TapeLoop as PWA |
| Spacebar | Play / Stop sequencer |

## Sample Trimming

Set start and end points for pads 1 and 2 to control which portion of the sample plays:

- **Start slider**: Sets the beginning point (0-100% of sample)
- **End slider**: Sets the end point (0-100% of sample)
- **Visual indicator**: Cyan bar on pad shows the trimmed range
- Trim points are saved with patterns and persist across sessions

## Pattern Banks & Song Mode

### Banks
- 4 independent banks (A, B, C, D) each with their own 2-track sequencer pattern
- Switch banks instantly with the A/B/C/D buttons
- Current bank is highlighted in magenta

### Song Mode
- Click **🎵 SONG** to enter song mode
- **+ ADD CURRENT**: Adds the current bank to the song chain
- **CLEAR**: Removes all steps from the song chain
- Click any step in the chain to jump to that bank (when stopped)
- Click **×** on a step to remove it
- During playback, the sequencer automatically advances through the song chain
- Save/load song arrangements with SAVE SONG / LOAD SONG

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
4. **Flanger** — Short modulated delay with feedback for jet-like sweeping
5. **Reverb** — Algorithmic multi-tap delay for ambient space
6. **Delay** — feedback echo with adjustable time and dry/wet mix
7. **Bitcrush** — sample rate reduction for lo-fi grit

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
- [x] Sample trimming / start-end points
- [x] Flanger / reverb effects
- [x] Multiple pattern banks / song mode

## Testing

The app itself ships as a single dependency-free `index.html`. A vitest + jsdom
harness (dev-only) boots the real page with a mocked AudioContext and exercises
the WAV encoder, MIDI mapping, and pattern persistence:

```bash
npm install
npm test   # 15 tests
```

## License

MIT
