/**
 * TapeLoop Memory Monitor
 * Tracks object counts, detects growth patterns, and reports potential leaks.
 * v0.8.0
 */

export function createMemoryMonitor(logger, options = {}) {
  const checkInterval = options.checkInterval || 30000;
  const growthThreshold = options.growthThreshold || 1.5;
  const sampleCount = options.samples || 10;

  let running = false;
  let intervalId = null;
  const samples = [];
  const trackers = new Map();

  function now() {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now();
    }
    return Date.now();
  }

  function getMemoryInfo() {
    const info = {
      timestamp: now(),
      jsHeapUsed: 0,
      jsHeapTotal: 0,
      jsHeapLimit: 0
    };
    if (typeof performance !== 'undefined' && performance.memory) {
      info.jsHeapUsed = performance.memory.usedJSHeapSize;
      info.jsHeapTotal = performance.memory.totalJSHeapSize;
      info.jsHeapLimit = performance.memory.jsHeapSizeLimit;
    }
    return info;
  }

  function recordSample() {
    const info = getMemoryInfo();
    const trackedCounts = {};
    for (const [name, tracker] of trackers) {
      trackedCounts[name] = tracker.count();
    }
    samples.push({ ...info, tracked: trackedCounts });
    if (samples.length > sampleCount) {
      samples.shift();
    }
    return { ...info, tracked: trackedCounts };
  }

  function detectLeak() {
    if (samples.length < 3) return null;
    const first = samples[0];
    const last = samples[samples.length - 1];

    // Detect JS heap growth
    if (first.jsHeapUsed > 0 && last.jsHeapUsed > 0) {
      const growth = last.jsHeapUsed / first.jsHeapUsed;
      if (growth > growthThreshold) {
        return {
          type: 'js-heap-growth',
          growthRatio: growth,
          firstBytes: first.jsHeapUsed,
          lastBytes: last.jsHeapUsed,
          message: `JS heap grew ${growth.toFixed(2)}x over ${samples.length} samples`
        };
      }
    }

    // Detect tracked object growth
    for (const name of Object.keys(first.tracked || {})) {
      const firstCount = first.tracked[name] || 0;
      const lastCount = last.tracked[name] || 0;
      if (firstCount > 0 && lastCount > firstCount * growthThreshold) {
        return {
          type: 'object-growth',
          objectType: name,
          growthRatio: lastCount / firstCount,
          firstCount,
          lastCount,
          message: `${name} count grew ${(lastCount / firstCount).toFixed(2)}x over ${samples.length} samples`
        };
      }
    }

    return null;
  }

  function registerTracker(name, countFn) {
    trackers.set(name, { count: countFn });
  }

  function unregisterTracker(name) {
    trackers.delete(name);
  }

  function start() {
    if (running) return;
    running = true;
    recordSample();
    intervalId = setInterval(() => {
      recordSample();
      const leak = detectLeak();
      if (leak) {
        if (logger && logger.warn) {
          logger.warn(`Memory leak detected: ${leak.message}`, leak);
        }
        if (options.onLeak) {
          try { options.onLeak(leak); } catch (e) {}
        }
      }
    }, checkInterval);
    if (logger && logger.info) logger.info('Memory monitor started');
  }

  function stop() {
    running = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (logger && logger.info) logger.info('Memory monitor stopped');
  }

  function getSamples() {
    return [...samples];
  }

  function getLatest() {
    return samples.length > 0 ? samples[samples.length - 1] : null;
  }

  function reset() {
    samples.length = 0;
  }

  return {
    start,
    stop,
    registerTracker,
    unregisterTracker,
    recordSample,
    detectLeak,
    getSamples,
    getLatest,
    reset
  };
}

export function createReferenceCounter() {
  const refs = new Set();
  return {
    add(id) { refs.add(id); },
    remove(id) { refs.delete(id); },
    has(id) { return refs.has(id); },
    count() { return refs.size; },
    clear() { refs.clear(); },
    getAll() { return Array.from(refs); }
  };
}
