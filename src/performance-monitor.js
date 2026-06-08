/**
 * TapeLoop Performance Monitor
 * Tracks FPS, audio latency, and memory usage.
 * v0.8.0
 */

export function createPerformanceMonitor(logger) {
  const metrics = {
    fps: { current: 0, min: Infinity, max: 0, avg: 0, samples: [] },
    audioLatency: { current: 0, min: Infinity, max: 0, avg: 0, samples: [] },
    memory: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 },
    frameTime: { current: 0, min: Infinity, max: 0, avg: 0, samples: [] }
  };

  let running = false;
  let rafId = null;
  let lastFrameTime = 0;
  let sampleCount = 0;
  const MAX_SAMPLES = 300; // keep last 5 minutes at 1fps

  function updateRolling(metric, value) {
    metric.current = value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.samples.push(value);
    if (metric.samples.length > MAX_SAMPLES) metric.samples.shift();
    metric.avg = metric.samples.reduce((a, b) => a + b, 0) / metric.samples.length;
  }

  function measureFrame(timestamp) {
    if (!running) return;
    if (lastFrameTime > 0) {
      const delta = timestamp - lastFrameTime;
      const fps = delta > 0 ? 1000 / delta : 0;
      updateRolling(metrics.fps, fps);
      updateRolling(metrics.frameTime, delta);
      sampleCount++;

      // Memory (Chrome only)
      if (performance && performance.memory) {
        metrics.memory.usedJSHeapSize = performance.memory.usedJSHeapSize;
        metrics.memory.totalJSHeapSize = performance.memory.totalJSHeapSize;
        metrics.memory.jsHeapSizeLimit = performance.memory.jsHeapSizeLimit;
      }
    }
    lastFrameTime = timestamp;
    rafId = requestAnimationFrame(measureFrame);
  }

  function start() {
    if (running) return;
    running = true;
    lastFrameTime = 0;
    rafId = requestAnimationFrame(measureFrame);
    if (logger && logger.info) logger.info('Performance monitor started');
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (logger && logger.info) logger.info('Performance monitor stopped');
  }

  function recordAudioLatency(latencyMs) {
    updateRolling(metrics.audioLatency, latencyMs);
  }

  function getMetrics() {
    return {
      fps: { ...metrics.fps, samples: undefined },
      frameTime: { ...metrics.frameTime, samples: undefined },
      audioLatency: { ...metrics.audioLatency, samples: undefined },
      memory: { ...metrics.memory }
    };
  }

  function getSummary() {
    return {
      fps: `${metrics.fps.current.toFixed(1)} (avg: ${metrics.fps.avg.toFixed(1)}, min: ${metrics.fps.min.toFixed(1)}, max: ${metrics.fps.max.toFixed(1)})`,
      frameTime: `${metrics.frameTime.current.toFixed(1)}ms (avg: ${metrics.frameTime.avg.toFixed(1)}ms)`,
      audioLatency: `${metrics.audioLatency.current.toFixed(1)}ms (avg: ${metrics.audioLatency.avg.toFixed(1)}ms)`,
      memory: metrics.memory.usedJSHeapSize > 0
        ? `Used: ${(metrics.memory.usedJSHeapSize / 1048576).toFixed(1)}MB / Limit: ${(metrics.memory.jsHeapSizeLimit / 1048576).toFixed(0)}MB`
        : 'N/A'
    };
  }

  function exportReport() {
    return JSON.stringify({
      timestamp: Date.now(),
      metrics: getMetrics(),
      fpsSamples: metrics.fps.samples,
      latencySamples: metrics.audioLatency.samples
    }, null, 2);
  }

  function reset() {
    metrics.fps = { current: 0, min: Infinity, max: 0, avg: 0, samples: [] };
    metrics.audioLatency = { current: 0, min: Infinity, max: 0, avg: 0, samples: [] };
    metrics.frameTime = { current: 0, min: Infinity, max: 0, avg: 0, samples: [] };
    metrics.memory = { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };
    sampleCount = 0;
    lastFrameTime = 0;
  }

  return {
    start,
    stop,
    recordAudioLatency,
    getMetrics,
    getSummary,
    exportReport,
    reset
  };
}

export function measureRAF(callback, durationMs = 1000) {
  return new Promise((resolve) => {
    const times = [];
    let start = performance.now();
    let rafId;

    function frame(now) {
      times.push(now);
      if (now - start < durationMs) {
        rafId = requestAnimationFrame(frame);
      } else {
        const fps = (times.length / ((now - start) / 1000));
        resolve({ fps, frames: times.length, duration: now - start });
      }
    }
    rafId = requestAnimationFrame(frame);
  });
}
