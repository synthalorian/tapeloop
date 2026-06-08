import { describe, it, expect } from 'vitest';
import {
  bufferToWav,
  fft,
  ifft,
  autoSlice,
  calculatePitchRate,
  bitcrushParams,
  limiterThreshold
} from '../src/audio-utils.js';

describe('Buffer to WAV', () => {
  it('converts audio buffer to WAV blob', () => {
    // Create a mock audio buffer
    const sampleRate = 44100;
    const length = 100;
    const numChannels = 2;
    const channelData = [
      new Float32Array(length).fill(0.5),
      new Float32Array(length).fill(-0.5)
    ];
    const mockBuffer = {
      numberOfChannels: numChannels,
      length,
      sampleRate,
      getChannelData: (c) => channelData[c]
    };

    const blob = bufferToWav(mockBuffer);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('audio/wav');
    expect(blob.size).toBe(length * numChannels * 2 + 44);
  });

  it('clamps values to valid range', () => {
    const channelData = [new Float32Array([1.5, -1.5, 0.5])];
    const mockBuffer = {
      numberOfChannels: 1,
      length: 3,
      sampleRate: 44100,
      getChannelData: (c) => channelData[c]
    };

    const blob = bufferToWav(mockBuffer);
    expect(blob.size).toBe(3 * 2 + 44);
  });
});

describe('FFT/IFFT', () => {
  it('performs FFT without errors', () => {
    const real = new Float32Array([1, 0, 0, 0]);
    const imag = new Float32Array([0, 0, 0, 0]);
    fft(real, imag);
    expect(real[0]).toBe(1);
  });

  it('IFFT returns approximately original signal', () => {
    const original = new Float32Array([1, 2, 3, 4]);
    const real = new Float32Array(original);
    const imag = new Float32Array(4);
    fft(real, imag);
    ifft(real, imag);
    for (let i = 0; i < 4; i++) {
      expect(real[i]).toBeCloseTo(original[i], 5);
    }
  });
});

describe('Auto Slice', () => {
  it('creates equal slices', () => {
    const slices = autoSlice(1000, 4);
    expect(slices).toHaveLength(4);
    expect(slices[0]).toEqual({ start: 0, end: 250 });
    expect(slices[3]).toEqual({ start: 750, end: 1000 });
  });

  it('handles remainder in last slice', () => {
    const slices = autoSlice(100, 3);
    expect(slices[2].end).toBe(100);
  });
});

describe('Pitch Rate Calculation', () => {
  it('calculates pitch rate for semitones', () => {
    expect(calculatePitchRate(0)).toBe(1);
    expect(calculatePitchRate(12)).toBeCloseTo(2, 5);
    expect(calculatePitchRate(-12)).toBeCloseTo(0.5, 5);
    expect(calculatePitchRate(7)).toBeCloseTo(1.4983, 2);
  });

  it('includes fine adjustment', () => {
    expect(calculatePitchRate(0, 100)).toBeCloseTo(Math.pow(2, 1/12), 5);
    expect(calculatePitchRate(0, -100)).toBeCloseTo(Math.pow(2, -1/12), 5);
  });
});

describe('Bitcrush Parameters', () => {
  it('returns full quality at zero', () => {
    const params = bitcrushParams(0);
    expect(params.bits).toBe(16);
    expect(params.normFreq).toBe(1);
  });

  it('reduces quality with higher values', () => {
    const params = bitcrushParams(0.5);
    expect(params.bits).toBeLessThan(16);
    expect(params.normFreq).toBeLessThan(1);
  });

  it('clamps to minimum values', () => {
    const params = bitcrushParams(1);
    expect(params.bits).toBe(2);
    expect(params.normFreq).toBeCloseTo(0.02, 10);
  });
});

describe('Limiter Threshold', () => {
  it('returns permissive threshold at low values', () => {
    expect(limiterThreshold(0)).toBe(17);
  });

  it('returns strict threshold at high values', () => {
    expect(limiterThreshold(1)).toBe(-40);
  });

  it('returns moderate threshold at mid values', () => {
    expect(limiterThreshold(0.5)).toBe(7);
  });
});
