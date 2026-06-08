# Getting Started with TapeLoop

A step-by-step walkthrough for first-time users.

---

## 1. Open the App

Double-click `index.html` (or right-click → Open With → Browser). TapeLoop runs entirely in the browser — no server required.

## 2. Start the Audio Engine

Click the **Start Audio** button in the top-left. This unlocks the Web Audio context so the browser allows sound playback.

> On some mobile browsers, you may need to tap the screen once before audio starts.

## 3. Load Samples

### Option A: File Picker
Click the **Load sample** input, select one or more WAV/MP3/OGG files, and click Open. Files are assigned to pads in order (first file → Pad 1, second → Pad 2, etc.).

### Option B: Drag and Drop
Drag audio files from your computer directly onto the TapeLoop window. They’ll land on the pads automatically.

## 4. Trigger Pads

Click or tap any pad to hear its sample. On desktop, press keys `1`–`8` to trigger pads quickly.

## 5. Program the Sequencer

Look at the 16×4 grid below the pads. Each row corresponds to a pad (row 1 = Pad 1, etc.), and each column is a 16th-note step.

- Click a step to toggle it on.
- The moving white outline shows the current playhead.
- Press **Play Seq** (or `Space`) to hear your pattern.

Try programming a basic four-on-the-floor beat:

```
Row 1 (Kick):  X . . . X . . . X . . . X . . .
Row 2 (Snare): . . . . X . . . . . . . X . . .
Row 3 (Hat):   . X . X . X . X . X . X . X . X
Row 4 (Perc):  . . . . . . X . . . . . . . X .
```

## 6. Add Effects

In the right-hand sidebar, experiment with:

- **Wobble** — tape flutter on the whole mix
- **Bitcrush** — gritty sample-rate reduction
- **Filter** — smooth lowpass cutoff
- **Reverb** — washed-out room sound
- **Limiter** — keep the output from clipping

## 7. Try a Demo Pattern

Open the **Load Set** button and select one of the `.json` files in `demo/patterns/`. The sequencer grid will update with a pre-programmed pattern. Adjust the BPM and press Play.

## 8. Save Your Work

Click **Save Set** to store your samples, patterns, and song chain in the browser. Next time you open TapeLoop, click **Load Set** to restore everything.

## 9. Export Your Beat

- **Export Mix** — records a 4-second WebM clip instantly
- **Export WAV** — renders a high-quality WAV of any length (try 16 or 32 seconds)

## 10. Next Steps

- Switch between pattern banks **A/B/C/D** to build variations
- Use **Song Mode** to chain patterns into a full arrangement
- Select a pad (Shift + click) and adjust pitch, slice, or stretch
- Record live pad hits into the sequencer with **Rec Seq**

Happy looping!
