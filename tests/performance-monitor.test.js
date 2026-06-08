/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createPerformanceMonitor, measureRAF } from '../src/performance-monitor.js';

describe('Performance Monitor', () => {
  let logger;
  let monitor;

  beforeEach(() => {
    logger = { info: vi.fn(), debug: vi.fn(), error: vi.fn() };
    monitor = createPerformanceMonitor(logger);
    vi.useFakeTimers();
  });

  afterEach(() => {
    monitor.stop();
    vi.useRealTimers();
  });

  it('starts and stops without error', () => {
    monitor.start();
    expect(logger.info).toHaveBeenCalledWith('Performance monitor started');
    monitor.stop();
    expect(logger.info).toHaveBeenCalledWith('Performance monitor stopped');
  });

  it('records audio latency metrics', () => {
    monitor.recordAudioLatency(50);
    monitor.recordAudioLatency(60);
    const metrics = monitor.getMetrics();
    expect(metrics.audioLatency.current).toBe(60);
    expect(metrics.audioLatency.avg).toBe(55);
    expect(metrics.audioLatency.min).toBe(50);
    expect(metrics.audioLatency.max).toBe(60);
  });

  it('getSummary returns formatted strings', () => {
    monitor.recordAudioLatency(50);
    const summary = monitor.getSummary();
    expect(summary.audioLatency).toContain('50.0ms');
    expect(summary.fps).toBeDefined();
    expect(summary.memory).toBeDefined();
  });

  it('reset clears all metrics', () => {
    monitor.recordAudioLatency(50);
    monitor.reset();
    const metrics = monitor.getMetrics();
    expect(metrics.audioLatency.current).toBe(0);
    expect(metrics.audioLatency.samples).toBeUndefined();
  });

  it('exportReport produces valid JSON', () => {
    monitor.recordAudioLatency(50);
    const report = monitor.exportReport();
    const parsed = JSON.parse(report);
    expect(parsed.timestamp).toBeDefined();
    expect(parsed.metrics).toBeDefined();
  });

  it('measureRAF exists and is callable', () => {
    expect(typeof measureRAF).toBe('function');
  });
});
