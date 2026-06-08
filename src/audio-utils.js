/**
 * TapeLoop Audio Utilities
 * Pure functions for audio processing and buffer manipulation.
 */

export function bufferToWav(buf) {
  const numOfChan = buf.numberOfChannels;
  const length = buf.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + buf.length * numOfChan * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, buf.sampleRate, true);
  view.setUint32(28, buf.sampleRate * 2 * numOfChan, true);
  view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, buf.length * numOfChan * 2, true);
  let offset = 44;
  for (let i = 0; i < buf.length; i++) {
    for (let c = 0; c < numOfChan; c++) {
      let s = Math.max(-1, Math.min(1, buf.getChannelData(c)[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset, s, true);
      offset += 2;
    }
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

export function fft(real, imag) {
  const n = real.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wlen_cos = Math.cos(ang), wlen_sin = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let w_real = 1, w_imag = 0;
      for (let j = 0; j < len / 2; j++) {
        const u_real = real[i+j], u_imag = imag[i+j];
        const v_real = real[i+j+len/2] * w_real - imag[i+j+len/2] * w_imag;
        const v_imag = real[i+j+len/2] * w_imag + imag[i+j+len/2] * w_real;
        real[i+j] = u_real + v_real;
        imag[i+j] = u_imag + v_imag;
        real[i+j+len/2] = u_real - v_real;
        imag[i+j+len/2] = u_imag - v_imag;
        const next_w_real = w_real * wlen_cos - w_imag * wlen_sin;
        w_imag = w_real * wlen_sin + w_imag * wlen_cos;
        w_real = next_w_real;
      }
    }
  }
}

export function ifft(real, imag) {
  const n = real.length;
  fft(imag, real);
  for (let i = 0; i < n; i++) {
    real[i] /= n;
    imag[i] /= n;
  }
}

export function autoSlice(bufferLength, numSlices) {
  const sliceSize = Math.floor(bufferLength / numSlices);
  const slices = [];
  for (let i = 0; i < numSlices; i++) {
    slices.push({
      start: i * sliceSize,
      end: (i === numSlices - 1) ? bufferLength : (i + 1) * sliceSize
    });
  }
  return slices;
}

export function calculatePitchRate(semitones, fine = 0) {
  return Math.pow(2, (semitones + fine / 100) / 12);
}

export function bitcrushParams(value) {
  const v = Math.max(0, Math.min(1, value));
  return {
    bits: v < 0.01 ? 16 : Math.max(2, 16 - Math.floor(v * 14)),
    normFreq: v < 0.01 ? 1 : Math.max(0.02, 1 - v * 0.98)
  };
}

export function limiterThreshold(value) {
  const v = Math.max(0, Math.min(1, value));
  return v > 0.9 ? -40 : -3 + (1 - v) * 20;
}
