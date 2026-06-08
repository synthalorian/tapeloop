/**
 * TapeLoop Error Boundary
 * Wraps audio operations with try/catch, user-friendly messages, and recovery.
 * v0.8.0
 */

const AudioErrorTypes = {
  CONTEXT_SUSPENDED: 'AudioContext is suspended',
  DECODE_FAILED: 'Failed to decode audio data',
  BUFFER_CREATE_FAILED: 'Failed to create audio buffer',
  NODE_CREATION_FAILED: 'Failed to create audio node',
  OVERFLOW: 'Audio buffer overflow / too large',
  UNKNOWN: 'Unknown audio error'
};

function classifyAudioError(err) {
  const msg = (err && err.message) || String(err);
  if (msg.includes('suspended') || msg.includes('AudioContext')) return AudioErrorTypes.CONTEXT_SUSPENDED;
  if (msg.includes('decode') || msg.includes('Decode')) return AudioErrorTypes.DECODE_FAILED;
  if (msg.includes('createBuffer') || msg.includes('buffer')) return AudioErrorTypes.BUFFER_CREATE_FAILED;
  if (msg.includes('create') && msg.includes('Node')) return AudioErrorTypes.NODE_CREATION_FAILED;
  if (msg.includes('overflow') || msg.includes('size') || msg.includes('large')) return AudioErrorTypes.OVERFLOW;
  return AudioErrorTypes.UNKNOWN;
}

export function createAudioErrorBoundary(logger, onError) {
  return async function audioTry(asyncFn, fallbackValue = null) {
    try {
      return await asyncFn();
    } catch (err) {
      const type = classifyAudioError(err);
      const userMessage = `[Audio Error] ${type}: ${err.message || err}`;
      if (logger && logger.error) logger.error(userMessage, { type, raw: err });
      if (onError) onError(type, err, userMessage);
      return fallbackValue;
    }
  };
}

export function syncAudioTry(fn, logger, onError, fallbackValue = null) {
  try {
    return fn();
  } catch (err) {
    const type = classifyAudioError(err);
    const userMessage = `[Audio Error] ${type}: ${err.message || err}`;
    if (logger && logger.error) logger.error(userMessage, { type, raw: err });
    if (onError) onError(type, err, userMessage);
    return fallbackValue;
  }
}

export function wrapAudioNodeCreator(audioCtx, logger, onError) {
  const originalCreateGain = audioCtx.createGain.bind(audioCtx);
  const originalCreateBufferSource = audioCtx.createBufferSource.bind(audioCtx);
  const originalCreateBiquadFilter = audioCtx.createBiquadFilter.bind(audioCtx);
  const originalCreateDelay = audioCtx.createDelay.bind(audioCtx);
  const originalCreateOscillator = audioCtx.createOscillator.bind(audioCtx);
  const originalCreateConvolver = audioCtx.createConvolver.bind(audioCtx);
  const originalCreateDynamicsCompressor = audioCtx.createDynamicsCompressor.bind(audioCtx);
  const originalCreateAnalyser = audioCtx.createAnalyser.bind(audioCtx);
  const originalCreateScriptProcessor = audioCtx.createScriptProcessor.bind(audioCtx);
  const originalCreateBuffer = audioCtx.createBuffer.bind(audioCtx);
  const originalDecodeAudioData = audioCtx.decodeAudioData.bind(audioCtx);

  function guarded(name, fn) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (err) {
        const type = classifyAudioError(err);
        const msg = `[Audio Node] ${name} failed: ${type}`;
        if (logger && logger.error) logger.error(msg, { type, raw: err });
        if (onError) onError(type, err, msg);
        return null;
      }
    };
  }

  audioCtx.createGain = guarded('createGain', originalCreateGain);
  audioCtx.createBufferSource = guarded('createBufferSource', originalCreateBufferSource);
  audioCtx.createBiquadFilter = guarded('createBiquadFilter', originalCreateBiquadFilter);
  audioCtx.createDelay = guarded('createDelay', originalCreateDelay);
  audioCtx.createOscillator = guarded('createOscillator', originalCreateOscillator);
  audioCtx.createConvolver = guarded('createConvolver', originalCreateConvolver);
  audioCtx.createDynamicsCompressor = guarded('createDynamicsCompressor', originalCreateDynamicsCompressor);
  audioCtx.createAnalyser = guarded('createAnalyser', originalCreateAnalyser);
  audioCtx.createScriptProcessor = guarded('createScriptProcessor', originalCreateScriptProcessor);
  audioCtx.createBuffer = guarded('createBuffer', originalCreateBuffer);
  audioCtx.decodeAudioData = async (...args) => {
    try {
      return await originalDecodeAudioData(...args);
    } catch (err) {
      const type = classifyAudioError(err);
      const msg = `[Audio Data] decodeAudioData failed: ${type}`;
      if (logger && logger.error) logger.error(msg, { type, raw: err });
      if (onError) onError(type, err, msg);
      throw err;
    }
  };

  return audioCtx;
}

export function safeDecodeAudioData(audioCtx, arrayBuffer, logger, onError) {
  return new Promise((resolve, reject) => {
    const onSuccess = (buffer) => {
      if (!buffer) {
        const err = new Error('decodeAudioData returned null buffer');
        const type = AudioErrorTypes.DECODE_FAILED;
        const msg = `[Audio Data] decodeAudioData returned null`;
        if (logger && logger.error) logger.error(msg, { type, raw: err });
        if (onError) onError(type, err, msg);
        reject(err);
        return;
      }
      resolve(buffer);
    };
    const onFail = (err) => {
      const type = AudioErrorTypes.DECODE_FAILED;
      const msg = `[Audio Data] decodeAudioData failed: ${err.message || err}`;
      if (logger && logger.error) logger.error(msg, { type, raw: err });
      if (onError) onError(type, err, msg);
      reject(err);
    };
    try {
      audioCtx.decodeAudioData(arrayBuffer.slice(0), onSuccess, onFail);
    } catch (err) {
      onFail(err);
    }
  });
}

export { AudioErrorTypes };
