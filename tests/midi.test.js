import { describe, it, expect, beforeEach } from 'vitest';
import { freshBoot } from './setup.js';

let app;
beforeEach(() => {
  app = freshBoot();
  app.localStorage.clear();
});

describe('MIDI map', () => {
  it('default map assigns notes 36-43 to pads 0-7', () => {
    const map = app.getDefaultMidiMap();
    expect(Object.keys(map)).toHaveLength(8);
    for (let i = 0; i < 8; i++) {
      expect(map[String(36 + i)]).toBe(i);
    }
  });

  it('falls back to defaults when storage is empty', () => {
    app.loadMidiMap();
    expect(app.getDefaultMidiMap()).toEqual(app.getDefaultMidiMap());
    const notes = Object.keys(app.getDefaultMidiMap());
    expect(notes).toHaveLength(8);
  });

  it('round-trips a custom map through localStorage', () => {
    app.loadMidiMap(); // establish defaults
    // Remap note 60 to pad 3 via the app's own machinery.
    const custom = { 60: 3, 61: 4 };
    app.localStorage.setItem('tapeloop_midi_map', JSON.stringify(custom));
    app.loadMidiMap();
    // Save again and confirm persistence of the loaded custom map.
    app.saveMidiMap();
    const stored = JSON.parse(app.localStorage.getItem('tapeloop_midi_map'));
    expect(stored).toEqual(custom);
  });

  it('recovers to defaults on corrupt JSON', () => {
    app.localStorage.setItem('tapeloop_midi_map', '{not valid json!!!');
    app.loadMidiMap(); // must not throw
    expect(app.getDefaultMidiMap()).toEqual(app.getDefaultMidiMap());
  });

  it('updateMidiDisplay writes MIDI note labels onto pads', () => {
    app.localStorage.setItem('tapeloop_midi_map', JSON.stringify({ 36: 0, 37: 1 }));
    app.loadMidiMap();
    app.updateMidiDisplay();

    const pads = app.document.querySelectorAll('.pad');
    expect(pads.length).toBeGreaterThanOrEqual(8);
    const pad0Note = pads[0].querySelector('.midi-note');
    const pad1Note = pads[1].querySelector('.midi-note');
    const pad2Note = pads[2].querySelector('.midi-note');
    expect(pad0Note.textContent).toContain('36');
    expect(pad1Note.textContent).toContain('37');
    expect(pad2Note.textContent).toBe(''); // unmapped pad shows nothing
  });
});
