/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAudioErrorBoundary,
  syncAudioTry,
  safeDecodeAudioData,
  wrapAudioNodeCreator,
  AudioErrorTypes
} from '../src/error-boundary.js';

describe('Error Boundary', () => {
  let logger;
  let onError;

  beforeEach(() => {
    logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn() };
    onError = vi.fn();
  });

  it('createAudioErrorBoundary resolves successful async fn', async () => {
    const boundary = createAudioErrorBoundary(logger, onError);
    const result = await boundary(async () => 'ok', 'fallback');
    expect(result).toBe('ok');
    expect(onError).not.toHaveBeenCalled();
  });

  it('createAudioErrorBoundary returns fallback on error', async () => {
    const boundary = createAudioErrorBoundary(logger, onError);
    const err = new Error('decode failed');
    const result = await boundary(async () => { throw err; }, 'fallback');
    expect(result).toBe('fallback');
    expect(onError).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('syncAudioTry returns result on success', () => {
    const result = syncAudioTry(() => 42, logger, onError, 0);
    expect(result).toBe(42);
    expect(onError).not.toHaveBeenCalled();
  });

  it('syncAudioTry returns fallback on error', () => {
    const result = syncAudioTry(() => { throw new Error('boom'); }, logger, onError, 99);
    expect(result).toBe(99);
    expect(onError).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('classifies decode errors correctly', async () => {
    const boundary = createAudioErrorBoundary(logger, onError);
    await boundary(async () => { throw new Error('decodeAudioData failed'); }, null);
    expect(onError).toHaveBeenCalled();
    const [, err] = onError.mock.calls[0];
    expect(err.message).toContain('decode');
  });

  it('wrapAudioNodeCreator guards node creation', () => {
    const ctx = {
      createGain: () => ({ type: 'gain' }),
      createBufferSource: () => ({ type: 'bufferSource' }),
      createBiquadFilter: () => ({ type: 'biquad' }),
      createDelay: () => ({ type: 'delay' }),
      createOscillator: () => ({ type: 'osc' }),
      createConvolver: () => ({ type: 'convolver' }),
      createDynamicsCompressor: () => ({ type: 'compressor' }),
      createAnalyser: () => ({ type: 'analyser' }),
      createScriptProcessor: () => ({ type: 'script' }),
      createBuffer: () => ({ type: 'buffer' }),
      decodeAudioData: () => Promise.resolve({ type: 'audio' })
    };
    const wrapped = wrapAudioNodeCreator(ctx, logger, onError);
    expect(wrapped.createGain()).toEqual({ type: 'gain' });
    expect(wrapped.createBufferSource()).toEqual({ type: 'bufferSource' });
  });

  it('safeDecodeAudioData resolves on success', async () => {
    const mockBuf = { duration: 1.0 };
    const ctx = {
      decodeAudioData: (ab, onSuccess, onFail) => {
        setTimeout(() => onSuccess(mockBuf), 0);
      }
    };
    const result = await safeDecodeAudioData(ctx, new ArrayBuffer(8), logger, onError);
    expect(result).toBe(mockBuf);
  });

  it('safeDecodeAudioData rejects on null buffer', async () => {
    const ctx = {
      decodeAudioData: (ab, onSuccess, onFail) => {
        setTimeout(() => onSuccess(null), 0);
      }
    };
    await expect(safeDecodeAudioData(ctx, new ArrayBuffer(8), logger, onError)).rejects.toThrow();
  });

  it('safeDecodeAudioData rejects on decode failure', async () => {
    const ctx = {
      decodeAudioData: (ab, onSuccess, onFail) => {
        setTimeout(() => onFail(new Error('bad data')), 0);
      }
    };
    await expect(safeDecodeAudioData(ctx, new ArrayBuffer(8), logger, onError)).rejects.toThrow('bad data');
  });
});
