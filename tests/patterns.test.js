import { describe, it, expect } from 'vitest';
import {
  STEPS,
  createEmptyPattern,
  normalizePattern,
  cycleProbability,
  toggleStep,
  createEmptySong,
  nextSongStep,
  calculateBPMFromIntervals,
  scheduleAheadTimeMs
} from '../src/patterns.js';

describe('Pattern Creation', () => {
  it('creates empty pattern with 4 rows and 16 steps', () => {
    const pattern = createEmptyPattern();
    expect(pattern).toHaveLength(4);
    expect(pattern[0]).toHaveLength(STEPS);
  });

  it('initializes steps with correct defaults', () => {
    const pattern = createEmptyPattern();
    const step = pattern[0][0];
    expect(step.active).toBe(false);
    expect(step.prob).toBe(1.0);
    expect(step.locks).toEqual({});
  });
});

describe('Pattern Normalization', () => {
  it('normalizes boolean steps to objects', () => {
    const oldPattern = [[true, false, true], [false, true]];
    const normalized = normalizePattern(oldPattern);
    expect(normalized[0][0]).toEqual({ active: true, prob: 1.0, locks: {} });
    expect(normalized[0][1]).toEqual({ active: false, prob: 1.0, locks: {} });
  });

  it('handles null/undefined input', () => {
    expect(normalizePattern(null)).toEqual(createEmptyPattern());
    expect(normalizePattern(undefined)).toEqual(createEmptyPattern());
  });

  it('preserves existing step objects', () => {
    const pattern = [[{ active: true, prob: 0.5, locks: { wobble: 0.3 } }]];
    const normalized = normalizePattern(pattern);
    expect(normalized[0][0]).toEqual({ active: true, prob: 0.5, locks: { wobble: 0.3 } });
  });

  it('handles invalid step values', () => {
    const pattern = [[null, 'invalid', 42]];
    const normalized = normalizePattern(pattern);
    expect(normalized[0][0]).toEqual({ active: false, prob: 1.0, locks: {} });
    expect(normalized[0][1]).toEqual({ active: false, prob: 1.0, locks: {} });
  });
});

describe('Probability Cycling', () => {
  it('cycles through probabilities correctly', () => {
    expect(cycleProbability(1.0)).toBe(0.75);
    expect(cycleProbability(0.75)).toBe(0.5);
    expect(cycleProbability(0.5)).toBe(0.25);
    expect(cycleProbability(0.25)).toBe(0);
    expect(cycleProbability(0)).toBe(1.0);
  });
});

describe('Step Toggling', () => {
  it('toggles step active state in default mode', () => {
    const pattern = createEmptyPattern();
    toggleStep(pattern, 0, 0, null, 'wobble', 0.5);
    expect(pattern[0][0].active).toBe(true);
    toggleStep(pattern, 0, 0, null, 'wobble', 0.5);
    expect(pattern[0][0].active).toBe(false);
  });

  it('cycles probability in prob mode', () => {
    const pattern = createEmptyPattern();
    toggleStep(pattern, 0, 0, 'prob', 'wobble', 0.5);
    expect(pattern[0][0].prob).toBe(0.75);
    expect(pattern[0][0].active).toBe(true);
  });

  it('sets parameter lock in lock mode', () => {
    const pattern = createEmptyPattern();
    toggleStep(pattern, 0, 0, 'lock', 'wobble', 0.5);
    expect(pattern[0][0].locks.wobble).toBe(0.5);
    expect(pattern[0][0].active).toBe(true);
  });

  it('removes parameter lock on second toggle', () => {
    const pattern = createEmptyPattern();
    toggleStep(pattern, 0, 0, 'lock', 'wobble', 0.5);
    toggleStep(pattern, 0, 0, 'lock', 'wobble', 0.5);
    expect(pattern[0][0].locks.wobble).toBeUndefined();
  });
});

describe('Song Mode', () => {
  it('creates empty song chain', () => {
    const song = createEmptySong();
    expect(song).toHaveLength(16);
    expect(song.every(s => s === null)).toBe(true);
  });

  it('advances to next non-empty step', () => {
    const chain = [null, 'A', null, 'B', null];
    expect(nextSongStep(chain, 0)).toBe(1);
    expect(nextSongStep(chain, 1)).toBe(3);
    expect(nextSongStep(chain, 3)).toBe(1); // wraps to A
  });

  it('stays on current step if no next pattern', () => {
    const chain = [null, null, null];
    expect(nextSongStep(chain, 0)).toBe(0);
  });
});

describe('BPM Calculation', () => {
  it('calculates BPM from tap intervals', () => {
    // 500ms = 120 BPM
    const intervals = [500, 500, 500];
    expect(calculateBPMFromIntervals(intervals)).toBe(120);
  });

  it('clamps BPM to valid range', () => {
    // 200ms = 300 BPM, clamped to 200
    expect(calculateBPMFromIntervals([200])).toBe(200);
    // 2000ms = 30 BPM, clamped to 40
    expect(calculateBPMFromIntervals([2000])).toBe(40);
  });

  it('returns null for empty intervals', () => {
    expect(calculateBPMFromIntervals([])).toBeNull();
    expect(calculateBPMFromIntervals(null)).toBeNull();
  });
});

describe('Scheduler Timing', () => {
  it('calculates 16th note duration correctly', () => {
    expect(scheduleAheadTimeMs(120)).toBeCloseTo(0.125, 5); // 60/120/4 = 0.125s
    expect(scheduleAheadTimeMs(60)).toBeCloseTo(0.25, 5);
  });
});
