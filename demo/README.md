# TapeLoop Demo Project

This directory contains example patterns and a getting-started guide for TapeLoop v0.9.0.

## What's Included

```
demo/
├── README.md                 # This file
├── patterns/
│   ├── boom-bap.json         # Classic hip-hop drum pattern at 88 BPM
│   ├── house.json            # Four-on-the-floor house beat at 124 BPM
│   ├── lo-fi-chill.json      # Relaxed lo-fi groove at 75 BPM
│   └── techno.json           # Driving techno sequence at 130 BPM
└── guide/
    └── getting-started.md    # Step-by-step walkthrough
```

## Loading a Demo Pattern

1. Open `index.html` in your browser.
2. Click **Start Audio**.
3. Load samples into pads 1–4 using the file picker or drag-and-drop.
   - Pad 1: Kick drum
   - Pad 2: Snare/clap
   - Pad 3: Hi-hat or closed hat
   - Pad 4: Open hat, percussion, or melodic element
4. Click **Load Set**.
5. Select one of the `.json` files from `demo/patterns/`.
6. Adjust the BPM to the value suggested in the pattern file.
7. Press **Play Seq**.

## Making the Patterns Your Own

Each demo pattern is intentionally simple — a starting point, not a finished track. Try:

- Adding probability to hi-hat steps for humanized grooves
- Using parameter locks on the snare row to change reverb per-hit
- Switching to Song Mode and chaining patterns A → B → C → D
- Recording live pad hits with **Rec Seq** while the sequencer plays

## Samples

Demo patterns do not include audio samples (to keep the repo lightweight and avoid licensing issues). Load your own samples, or use any of the many free drum kits available online. Recommended sample pack labels to map to pads:

| Pad | Recommended Sample | Common Labels |
|-----|-------------------|---------------|
| 1 | Kick | `KD`, `Kick`, `BD` |
| 2 | Snare / Clap | `SD`, `Snare`, `Clap`, `CP` |
| 3 | Closed Hi-Hat | `CH`, `HHC`, `ClosedHH` |
| 4 | Open Hat / Perc | `OH`, `HHO`, `Perc`, `Shaker` |

## License

The demo pattern files are released under the same MIT license as TapeLoop itself. Use them freely in your own productions.
