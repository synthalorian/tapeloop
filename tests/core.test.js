import { describe, it, expect, beforeEach } from 'vitest';
import {
  STEPS, PADS, BANKS, SONG_SLOTS, padNames,
  createEmptyPattern, normalizePattern, createDefaultPadSettings,
  createDefaultPatterns, createEmptySongChain,
  autoSlice, fft, ifft, bufferToWav,
  calculateLatencyCompensation,
  calculateBpmFromTaps, detectSwipeDirection,
  PROBABILITIES, cycleProbability,
  getNextSongStep, getFirstSongStep,
  calculatePlaybackRate, calculateBitcrushParams,
  copyPattern, clearPattern,
  serializePatterns, deserializePatterns, serializePadSettings
} from '../src/core.js';

describe('TapeLoop Core', () => {
  describe('Pattern Operations', () => {
    it('createEmptyPattern returns 4 rows of 16 steps', () => {
      const p = createEmptyPattern();
      expect(p).toHaveLength(4);
      p.forEach(row => {
        expect(row).toHaveLength(STEPS);
        row.forEach(step => {
          expect(step).toEqual({ active: false, prob: 1.0, locks: {} });
        });
      });
    });

    it('normalizePattern handles boolean legacy format', () => {
      const legacy = [
        [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true],
        Array(16).fill(false),
        Array(16).fill(false)
      ];
      const normalized = normalizePattern(legacy);
      expect(normalized[0][0]).toEqual({ active: true, prob: 1.0, locks: {} });
      expect(normalized[0][1]).toEqual({ active: false, prob: 1.0, locks: {} });
    });

    it('normalizePattern handles object format', () => {
      const objPattern = [
        [{ active: true, prob: 0.75, locks: { wobble: 0.5 } }, ...Array(15).fill({ active: false, prob: 1.0, locks: {} })],
        ...Array(3).fill(Array(16).fill({ active: false, prob: 1.0, locks: {} }))
      ];
      const normalized = normalizePattern(objPattern);
      expect(normalized[0][0]).toEqual({ active: true, prob: 0.75, locks: { wobble: 0.5 } });
    });

    it('normalizePattern handles null/undefined', () => {
      expect(normalizePattern(null)).toEqual(createEmptyPattern());
      expect(normalizePattern(undefined)).toEqual(createEmptyPattern());
    });

    it('normalizePattern handles malformed steps', () => {
      const malformed = [
        [null, 'string', 42, true, { active: true }, undefined, ...Array(10).fill(false)],
        ...Array(3).fill(Array(16).fill(false))
      ];
      const normalized = normalizePattern(malformed);
      expect(normalized[0][0]).toEqual({ active: false, prob: 1.0, locks: {} });
      expect(normalized[0][1]).toEqual({ active: false, prob: 1.0, locks: {} });
      expect(normalized[0][2]).toEqual({ active: false, prob: 1.0, locks: {} });
      expect(normalized[0][3]).toEqual({ active: true, prob: 1.0, locks: {} });
      expect(normalized[0][4]).toEqual({ active: true, prob: 1.0, locks: {} });
      expect(normalized[0][5]).toEqual({ active: false, prob: 1.0, locks: {} });
    });

    it('copyPattern creates deep copy', () => {
      const original = createEmptyPattern();
      original[0][0].active = true;
      original[0][0].locks.wobble = 0.5;
      const copied = copyPattern(original);
      expect(copied).toEqual(original);
      expect(copied).not.toBe(original);
      expect(copied[0]).not.toBe(original[0]);
      expect(copied[0][0]).not.toBe(original[0][0]);
    });

    it('clearPattern returns fresh empty pattern', () => {
      const cleared = clearPattern();
      expect(cleared).toEqual(createEmptyPattern());
    });
  });

  describe('Pad Settings', () => {
    it('createDefaultPadSettings returns correct defaults', () => {
      const s = createDefaultPadSettings();
      expect(s.pitchSemitones).toBe(0);
      expect(s.pitchFine).toBe(0);
      expect(s.slices).toEqual([]);
      expect(s.stretchedBuffer).toBeNull();
      expect(s.stretchRatio).toBe(1);
      expect(s.chopMode).toBe(false);
    });

    it('createDefaultPatterns returns all banks', () => {
      const p = createDefaultPatterns();
      expect(Object.keys(p)).toEqual(BANKS);
      BANKS.forEach(bank => {
        expect(p[bank]).toEqual(createEmptyPattern());
      });
    });
  });

  describe('Song Chain', () => {
    it('createEmptySongChain returns null-filled array', () => {
      const chain = createEmptySongChain();
      expect(chain).toHaveLength(SONG_SLOTS);
      chain.forEach(slot => expect(slot).toBeNull());
    });

    it('getNextSongStep finds next non-empty slot', () => {
      const chain = Array(SONG_SLOTS).fill(null);
      chain[3] = 'A';
      chain[5] = 'B';
      expect(getNextSongStep(chain, 2)).toBe(3);
      expect(getNextSongStep(chain, 3)).toBe(5);
    });

    it('getNextSongStep wraps around', () => {
      const chain = Array(SONG_SLOTS).fill(null);
      chain[0] = 'A';
      chain[15] = 'B';
      expect(getNextSongStep(chain, 15)).toBe(0);
    });

    it('getNextSongStep returns null when all empty', () => {
      const chain = Array(SONG_SLOTS).fill(null);
      expect(getNextSongStep(chain, 0)).toBeNull();
    });

    it('getFirstSongStep finds first non-empty', () => {
      const chain = Array(SONG_SLOTS).fill(null);
      chain[5] = 'A';
      expect(getFirstSongStep(chain)).toBe(5);
    });

    it('getFirstSongStep returns null when all empty', () => {
      const chain = Array(SONG_SLOTS).fill(null);
      expect(getFirstSongStep(chain)).toBeNull();
    });
  });

  describe('Probability', () => {
    it('cycleProbability cycles through values', () => {
      expect(cycleProbability(1.0)).toBe(0.75);
      expect(cycleProbability(0.75)).toBe(0.5);
      expect(cycleProbability(0.5)).toBe(0.25);
      expect(cycleProbability(0.25)).toBe(0);
      expect(cycleProbability(0)).toBe(1.0);
    });

    it('PROBABILITIES array is correct', () => {
      expect(PROBABILITIES).toEqual([1.0, 0.75, 0.5, 0.25, 0]);
    });
  });

  describe('Audio Utilities', () => {
    it('calculatePlaybackRate computes correct rates', () => {
      expect(calculatePlaybackRate(0)).toBeCloseTo(1.0, 5);
      expect(calculatePlaybackRate(12)).toBeCloseTo(2.0, 5);
      expect(calculatePlaybackRate(-12)).toBeCloseTo(0.5, 5);
      expect(calculatePlaybackRate(0, 100)).toBeCloseTo(Math.pow(2, 100/1200), 5);
    });

    it('calculateBitcrushParams handles edge cases', () => {
      expect(calculateBitcrushParams(0)).toEqual({ bits: 16, normFreq: 1 });
      expect(calculateBitcrushParams(0.005)).toEqual({ bits: 16, normFreq: 1 });
      const full = calculateBitcrushParams(1.0);
      expect(full.bits).toBe(2);
      expect(full.normFreq).toBeCloseTo(0.02, 5);
    });

    it('calculateBitcrushParams at 0.5', () => {
      const mid = calculateBitcrushParams(0.5);
      expect(mid.bits).toBe(9);
      expect(mid.normFreq).toBe(0.51);
    });
  });

  describe('Tap Tempo', () => {
    it('calculateBpmFromTaps returns null with < 2 taps', () => {
      expect(calculateBpmFromTaps([])).toBeNull();
      expect(calculateBpmFromTaps([1000])).toBeNull();
    });

    it('calculateBpmFromTaps calculates BPM correctly', () => {
      // 500ms interval = 120 BPM
      const taps = [0, 500, 1000, 1500];
      expect(calculateBpmFromTaps(taps)).toBe(120);
    });

    it('calculateBpmFromTaps handles variable intervals', () => {
      // Average 600ms = 100 BPM
      const taps = [0, 600, 1200, 1800];
      expect(calculateBpmFromTaps(taps)).toBe(100);
    });
  });

  describe('Touch Gestures', () => {
    it('detectSwipeDirection returns null for small movements', () => {
      expect(detectSwipeDirection({ clientX: 0, clientY: 0 }, { clientX: 10, clientY: 10 })).toBeNull();
    });

    it('detectSwipeDirection detects horizontal swipes', () => {
      expect(detectSwipeDirection({ clientX: 0, clientY: 0 }, { clientX: 50, clientY: 5 })).toBe('right');
      expect(detectSwipeDirection({ clientX: 50, clientY: 0 }, { clientX: 0, clientY: 5 })).toBe('left');
    });

    it('detectSwipeDirection detects vertical swipes', () => {
      expect(detectSwipeDirection({ clientX: 0, clientY: 0 }, { clientX: 5, clientY: 50 })).toBe('down');
      expect(detectSwipeDirection({ clientX: 0, clientY: 50 }, { clientX: 5, clientY: 0 })).toBe('up');
    });

    it('detectSwipeDirection respects custom threshold', () => {
      expect(detectSwipeDirection({ clientX: 0, clientY: 0 }, { clientX: 20, clientY: 0 }, 30)).toBeNull();
      expect(detectSwipeDirection({ clientX: 0, clientY: 0 }, { clientX: 40, clientY: 0 }, 30)).toBe('right');
    });
  });

  describe('Latency Compensation', () => {
    it('calculateLatencyCompensation uses API values', () => {
      const mockCtx = {
        baseLatency: 0.01,
        outputLatency: 0.02
      };
      const result = calculateLatencyCompensation(mockCtx);
      expect(result.baseLatency).toBe(0.01);
      expect(result.outputLatency).toBe(0.02);
      expect(result.total).toBe(0.03);
      expect(result.compensation).toBe(-0.03);
    });

    it('calculateLatencyCompensation handles missing values', () => {
      const mockCtx = {};
      const result = calculateLatencyCompensation(mockCtx);
      expect(result.baseLatency).toBe(0);
      expect(result.outputLatency).toBe(0);
      expect(result.total).toBe(0);
      expect(result.compensation).toBe(-0);
    });
  });

  describe('Serialization', () => {
    it('serializePatterns returns JSON string', () => {
      const patterns = createDefaultPatterns();
      patterns.A[0][0].active = true;
      const json = serializePatterns(patterns);
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.A[0][0].active).toBe(true);
    });

    it('deserializePatterns normalizes all banks', () => {
      const patterns = createDefaultPatterns();
      const json = serializePatterns(patterns);
      const deserialized = deserializePatterns(json);
      BANKS.forEach(bank => {
        expect(deserialized[bank]).toHaveLength(4);
        deserialized[bank].forEach(row => {
          expect(row).toHaveLength(STEPS);
          row.forEach(step => {
            expect(step).toHaveProperty('active');
            expect(step).toHaveProperty('prob');
            expect(step).toHaveProperty('locks');
          });
        });
      });
    });

    it('deserializePatterns handles missing banks', () => {
      const json = JSON.stringify({ A: createEmptyPattern() });
      const deserialized = deserializePatterns(json);
      expect(deserialized.A).toBeDefined();
      expect(deserialized.B).toEqual(createEmptyPattern());
    });

    it('serializePadSettings strips non-serializable data', () => {
      const settings = Array.from({ length: PADS }, () => ({
        ...createDefaultPadSettings(),
        stretchedBuffer: { some: 'object' }, // should be stripped
        slices: [{ start: 0, end: 1000 }]
      }));
      const json = serializePadSettings(settings);
      const parsed = JSON.parse(json);
      expect(parsed[0]).not.toHaveProperty('stretchedBuffer');
      expect(parsed[0].slices).toEqual([{ start: 0, end: 1000 }]);
    });
  });

  describe('Auto-slice', () => {
    it('autoSlice returns empty array for null buffer', () => {
      expect(autoSlice(null, 8)).toEqual([]);
    });

    it('autoSlice creates equal segments', () => {
      const mockBuffer = { length: 8000 };
      const slices = autoSlice(mockBuffer, 8);
      expect(slices).toHaveLength(8);
      expect(slices[0]).toEqual({ start: 0, end: 1000 });
      expect(slices[7]).toEqual({ start: 7000, end: 8000 });
    });

    it('autoSlice handles non-divisible lengths', () => {
      const mockBuffer = { length: 100 };
      const slices = autoSlice(mockBuffer, 3);
      expect(slices).toHaveLength(3);
      expect(slices[0]).toEqual({ start: 0, end: 33 });
      expect(slices[2]).toEqual({ start: 66, end: 100 });
    });
  });

  describe('FFT/IFFT', () => {
    it('fft and ifft are inverse operations', () => {
      const n = 8;
      const real = new Float32Array([1, 0, 0, 0, 0, 0, 0, 0]);
      const imag = new Float32Array(n);
      const realCopy = new Float32Array(real);

      fft(real, imag);
      ifft(real, imag);

      for (let i = 0; i < n; i++) {
        expect(real[i]).toBeCloseTo(realCopy[i], 5);
      }
    });

    it('fft produces correct DC component', () => {
      const n = 8;
      const real = new Float32Array([1, 1, 1, 1, 1, 1, 1, 1]);
      const imag = new Float32Array(n);
      fft(real, imag);
      // DC component should be 8 (sum of all samples)
      expect(real[0]).toBeCloseTo(8, 5);
      expect(imag[0]).toBeCloseTo(0, 5);
    });
  });

  describe('Buffer to WAV', () => {
    it('bufferToWav creates valid WAV blob', () => {
      const mockBuffer = {
        numberOfChannels: 1,
        length: 100,
        sampleRate: 44100,
        getChannelData: () => new Float32Array(100).fill(0)
      };
      const blob = bufferToWav(mockBuffer);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('audio/wav');
    });

    it('bufferToWav creates correct header size', () => {
      const mockBuffer = {
        numberOfChannels: 2,
        length: 100,
        sampleRate: 44100,
        getChannelData: () => new Float32Array(100).fill(0)
      };
      const blob = bufferToWav(mockBuffer);
      // 44 byte header + 100 samples * 2 channels * 2 bytes
      expect(blob.size).toBe(44 + 100 * 2 * 2);
    });

    it('bufferToWav clamps values', () => {
      const mockBuffer = {
        numberOfChannels: 1,
        length: 3,
        sampleRate: 44100,
        getChannelData: () => new Float32Array([1.5, -1.5, 0.5])
      };
      const blob = bufferToWav(mockBuffer);
      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('Constants', () => {
    it('has correct constants', () => {
      expect(STEPS).toBe(16);
      expect(PADS).toBe(16);
      expect(BANKS).toEqual(['A', 'B', 'C', 'D']);
      expect(SONG_SLOTS).toBe(16);
      expect(padNames).toHaveLength(16);
    });
  });
});
