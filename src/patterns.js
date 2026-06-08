/**
 * TapeLoop Pattern Logic
 * Pure functions for sequencer pattern creation and manipulation.
 */

export const STEPS = 16;
export const PADS = 16;
export const BANKS = ['A', 'B', 'C', 'D'];

export function createEmptyPattern() {
  return Array.from({ length: 4 }, () =>
    Array.from({ length: STEPS }, () => ({ active: false, prob: 1.0, locks: {} }))
  );
}

export function normalizePattern(p) {
  if (!p || !Array.isArray(p)) return createEmptyPattern();
  return p.map(row => {
    if (!Array.isArray(row)) row = new Array(STEPS).fill(false);
    return row.map(step => {
      if (typeof step === 'boolean') {
        return { active: step, prob: 1.0, locks: {} };
      }
      if (typeof step !== 'object' || step === null) {
        return { active: false, prob: 1.0, locks: {} };
      }
      return {
        active: !!step.active,
        prob: typeof step.prob === 'number' ? step.prob : 1.0,
        locks: step.locks && typeof step.locks === 'object' ? step.locks : {}
      };
    });
  });
}

export function cycleProbability(current) {
  const probs = [1.0, 0.75, 0.5, 0.25, 0];
  const idx = probs.indexOf(current);
  return probs[(idx + 1) % probs.length];
}

export function toggleStep(pattern, row, col, editMode, lockParam, lockValue) {
  const step = pattern[row][col];
  if (editMode === 'prob') {
    const nextProb = cycleProbability(step.prob);
    step.prob = nextProb;
    if (nextProb === 0) step.active = false;
    else step.active = true;
  } else if (editMode === 'lock') {
    if (step.locks[lockParam] !== undefined) {
      delete step.locks[lockParam];
    } else {
      step.locks[lockParam] = lockValue;
    }
    if (Object.keys(step.locks).length > 0 && !step.active) {
      step.active = true;
      step.prob = 1.0;
    }
  } else {
    step.active = !step.active;
    if (!step.active) {
      step.prob = 1.0;
      step.locks = {};
    }
  }
  return pattern;
}

export function createEmptySong(slots = 16) {
  return Array(slots).fill(null);
}

export function nextSongStep(songChain, currentStep) {
  const len = songChain.length;
  let next = (currentStep + 1) % len;
  let loopCount = 0;
  while (!songChain[next] && loopCount < len) {
    next = (next + 1) % len;
    loopCount++;
  }
  return songChain[next] ? next : currentStep;
}

export function calculateBPMFromIntervals(intervals) {
  if (!intervals || intervals.length === 0) return null;
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  return Math.max(40, Math.min(200, Math.round(60000 / avg)));
}

export function scheduleAheadTimeMs(bpm, steps = 16) {
  return (60.0 / bpm) / 4; // 16th note duration in seconds
}
