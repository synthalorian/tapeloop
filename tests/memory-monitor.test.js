/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createMemoryMonitor, createReferenceCounter } from '../src/memory-monitor.js';

describe('Memory Monitor', () => {
  let logger;
  let monitor;

  beforeEach(() => {
    logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    monitor = createMemoryMonitor(logger, { checkInterval: 1000, growthThreshold: 1.5, samples: 5 });
    vi.useFakeTimers();
  });

  afterEach(() => {
    monitor.stop();
    vi.useRealTimers();
  });

  it('starts and stops without error', () => {
    monitor.start();
    expect(logger.info).toHaveBeenCalledWith('Memory monitor started');
    monitor.stop();
    expect(logger.info).toHaveBeenCalledWith('Memory monitor stopped');
  });

  it('records samples with memory info', () => {
    const sample = monitor.recordSample();
    expect(sample.timestamp).toBeDefined();
    expect(sample.jsHeapUsed).toBeDefined();
    expect(sample.jsHeapTotal).toBeDefined();
  });

  it('registers and unregisters trackers', () => {
    const counter = createReferenceCounter();
    monitor.registerTracker('test-objects', () => counter.count());
    counter.add('a');
    counter.add('b');
    const sample = monitor.recordSample();
    expect(sample.tracked['test-objects']).toBe(2);
    monitor.unregisterTracker('test-objects');
    const sample2 = monitor.recordSample();
    expect(sample2.tracked['test-objects']).toBeUndefined();
  });

  it('detects JS heap growth leaks', () => {
    const originalMemory = performance.memory;
    Object.defineProperty(performance, 'memory', {
      value: { usedJSHeapSize: 50000000, totalJSHeapSize: 100000000, jsHeapSizeLimit: 1000000000 },
      configurable: true
    });
    monitor.recordSample();
    Object.defineProperty(performance, 'memory', {
      value: { usedJSHeapSize: 100000000, totalJSHeapSize: 200000000, jsHeapSizeLimit: 1000000000 },
      configurable: true
    });
    monitor.recordSample();
    monitor.recordSample();
    const leak = monitor.detectLeak();
    expect(leak).not.toBeNull();
    expect(leak.type).toBe('js-heap-growth');
    if (originalMemory) {
      Object.defineProperty(performance, 'memory', { value: originalMemory, configurable: true });
    }
  });

  it('detects tracked object growth leaks', () => {
    const counter = createReferenceCounter();
    monitor.registerTracker('nodes', () => counter.count());
    counter.add('a');
    monitor.recordSample();
    for (let i = 0; i < 10; i++) counter.add(`node_${i}`);
    monitor.recordSample();
    monitor.recordSample();
    const leak = monitor.detectLeak();
    expect(leak).not.toBeNull();
    expect(leak.type).toBe('object-growth');
    expect(leak.objectType).toBe('nodes');
  });

  it('returns null when no leak detected', () => {
    const counter = createReferenceCounter();
    monitor.registerTracker('stable', () => counter.count());
    counter.add('a');
    monitor.recordSample();
    monitor.recordSample();
    monitor.recordSample();
    expect(monitor.detectLeak()).toBeNull();
  });

  it('getSamples returns recorded samples', () => {
    monitor.recordSample();
    monitor.recordSample();
    expect(monitor.getSamples().length).toBe(2);
  });

  it('getLatest returns most recent sample', () => {
    expect(monitor.getLatest()).toBeNull();
    monitor.recordSample();
    expect(monitor.getLatest()).not.toBeNull();
  });

  it('reset clears samples', () => {
    monitor.recordSample();
    monitor.reset();
    expect(monitor.getSamples().length).toBe(0);
  });

  it('triggers onLeak callback when leak detected', () => {
    const onLeak = vi.fn();
    const leakMonitor = createMemoryMonitor(logger, {
      checkInterval: 500,
      growthThreshold: 1.2,
      onLeak
    });
    const counter = createReferenceCounter();
    leakMonitor.registerTracker('growing', () => counter.count());
    counter.add('a');
    leakMonitor.start();
    vi.advanceTimersByTime(500);
    for (let i = 0; i < 5; i++) counter.add(`node_${i}`);
    vi.advanceTimersByTime(500);
    expect(onLeak).toHaveBeenCalled();
    leakMonitor.stop();
  });
});

describe('Reference Counter', () => {
  it('tracks references', () => {
    const counter = createReferenceCounter();
    counter.add('a');
    counter.add('b');
    expect(counter.count()).toBe(2);
    expect(counter.has('a')).toBe(true);
    expect(counter.has('c')).toBe(false);
  });

  it('removes references', () => {
    const counter = createReferenceCounter();
    counter.add('a');
    counter.remove('a');
    expect(counter.count()).toBe(0);
    expect(counter.has('a')).toBe(false);
  });

  it('clears all references', () => {
    const counter = createReferenceCounter();
    counter.add('a');
    counter.add('b');
    counter.clear();
    expect(counter.count()).toBe(0);
  });

  it('returns all references', () => {
    const counter = createReferenceCounter();
    counter.add('a');
    counter.add('b');
    expect(counter.getAll()).toEqual(['a', 'b']);
  });
});
