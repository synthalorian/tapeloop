import { describe, it, expect, beforeAll } from 'vitest';
import { bootApp, fakeBuffer } from './setup.js';

let app;
beforeAll(() => { app = bootApp(); });

async function blobToView(blob) {
  const ab = await blob.arrayBuffer();
  return new DataView(ab);
}

describe('audioBufferToWav', () => {
  it('writes a valid RIFF/WAVE/fmt/data header for mono', async () => {
    const buf = fakeBuffer(1, 100, 44100, () => 0);
    const blob = app.audioBufferToWav(buf);
    const v = await blobToView(blob);

    expect(String.fromCharCode(v.getUint8(0), v.getUint8(1), v.getUint8(2), v.getUint8(3))).toBe('RIFF');
    expect(String.fromCharCode(v.getUint8(8), v.getUint8(9), v.getUint8(10), v.getUint8(11))).toBe('WAVE');
    expect(String.fromCharCode(v.getUint8(12), v.getUint8(13), v.getUint8(14), v.getUint8(15))).toBe('fmt ');
    expect(String.fromCharCode(v.getUint8(36), v.getUint8(37), v.getUint8(38), v.getUint8(39))).toBe('data');
    expect(v.getUint16(20, true)).toBe(1);      // PCM format
    expect(v.getUint16(22, true)).toBe(1);      // mono
    expect(v.getUint32(24, true)).toBe(44100);  // sample rate
    expect(v.getUint16(34, true)).toBe(16);     // bit depth
  });

  it('computes correct chunk sizes for stereo', async () => {
    const frames = 500;
    const buf = fakeBuffer(2, frames, 48000, () => 0);
    const v = await blobToView(app.audioBufferToWav(buf));

    const dataLen = frames * 2 * 2; // frames * ch * bytes
    expect(v.getUint32(40, true)).toBe(dataLen);
    expect(v.getUint32(4, true)).toBe(36 + dataLen);
    expect(v.byteLength).toBe(44 + dataLen);
    expect(v.getUint32(24, true)).toBe(48000);
    expect(v.getUint16(22, true)).toBe(2);
  });

  it('converts float samples to 16-bit PCM with correct polarity', async () => {
    const buf = fakeBuffer(1, 4, 44100, (i) => [0, 0.5, -1, 1][i]);
    const v = await blobToView(app.audioBufferToWav(buf));

    expect(v.getInt16(44, true)).toBe(0);
    expect(v.getInt16(46, true)).toBe(Math.trunc(0.5 * 0x7FFF));
    expect(v.getInt16(48, true)).toBe(-0x8000);
    expect(v.getInt16(50, true)).toBe(0x7FFF);
  });

  it('clips out-of-range samples instead of overflowing', async () => {
    const buf = fakeBuffer(1, 2, 44100, (i) => (i === 0 ? 1.7 : -2.3));
    const v = await blobToView(app.audioBufferToWav(buf));

    expect(v.getInt16(44, true)).toBe(0x7FFF);   // clamped to +1
    expect(v.getInt16(46, true)).toBe(-0x8000);  // clamped to -1
  });

  it('interleaves stereo channels L,R,L,R', async () => {
    const buf = fakeBuffer(2, 3, 44100, (i, c) => (c === 0 ? 0.25 : -0.25));
    const v = await blobToView(app.audioBufferToWav(buf));
    const l = Math.trunc(0.25 * 0x7FFF);
    const r = Math.trunc(-0.25 * 0x8000);

    for (let i = 0; i < 3; i++) {
      expect(v.getInt16(44 + i * 4, true)).toBe(l);      // left
      expect(v.getInt16(44 + i * 4 + 2, true)).toBe(r);  // right
    }
  });
});
