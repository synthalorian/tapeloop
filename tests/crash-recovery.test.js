/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createCrashRecovery, SNAPSHOT_KEY } from '../src/crash-recovery.js';

describe('Crash Recovery', () => {
  let logger;
  let recovery;

  beforeEach(() => {
    localStorage.clear();
    logger = { info: vi.fn(), debug: vi.fn(), error: vi.fn() };
    recovery = createCrashRecovery(logger);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    recovery.stopAutoSave();
    localStorage.clear();
  });

  it('saveSnapshot stores state in localStorage', () => {
    const state = { bpm: 120, pattern: 'A' };
    const result = recovery.saveSnapshot(state);
    expect(result).toBe(true);
    const stored = JSON.parse(localStorage.getItem(SNAPSHOT_KEY));
    expect(stored.state.bpm).toBe(120);
    expect(stored.meta.version).toBe('0.8.0');
  });

  it('loadSnapshot retrieves stored state', () => {
    const state = { bpm: 120 };
    recovery.saveSnapshot(state);
    const snapshot = recovery.loadSnapshot();
    expect(snapshot.state.bpm).toBe(120);
  });

  it('hasRecoverableSnapshot returns false when empty', () => {
    expect(recovery.hasRecoverableSnapshot()).toBe(false);
  });

  it('hasRecoverableSnapshot returns true after save', () => {
    recovery.saveSnapshot({ bpm: 100 });
    expect(recovery.hasRecoverableSnapshot()).toBe(true);
  });

  it('returns null for expired snapshots (>24h)', () => {
    const oldState = { bpm: 100 };
    recovery.saveSnapshot(oldState);
    // Manually set timestamp to 25 hours ago
    const stored = JSON.parse(localStorage.getItem(SNAPSHOT_KEY));
    stored.meta.timestamp = Date.now() - 25 * 60 * 60 * 1000;
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(stored));
    expect(recovery.loadSnapshot()).toBeNull();
  });

  it('clearSnapshot removes stored data', () => {
    recovery.saveSnapshot({ bpm: 100 });
    recovery.clearSnapshot();
    expect(recovery.hasRecoverableSnapshot()).toBe(false);
  });

  it('startAutoSave saves periodically', () => {
    const stateFn = vi.fn(() => ({ bpm: 120 }));
    recovery.startAutoSave(stateFn, 30000);
    expect(stateFn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(30000);
    expect(stateFn).toHaveBeenCalled();
  });

  it('stopAutoSave stops the interval', () => {
    const stateFn = vi.fn(() => ({ bpm: 120 }));
    recovery.startAutoSave(stateFn, 30000);
    vi.advanceTimersByTime(30000);
    expect(stateFn).toHaveBeenCalledTimes(1);
    recovery.stopAutoSave();
    vi.advanceTimersByTime(60000);
    expect(stateFn).toHaveBeenCalledTimes(1);
  });

  it('getLastSnapshot returns last saved snapshot', () => {
    const state = { bpm: 120 };
    recovery.saveSnapshot(state);
    const last = recovery.getLastSnapshot();
    expect(last.state.bpm).toBe(120);
  });

  it('handles save errors gracefully', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    const result = recovery.saveSnapshot({ bpm: 120 });
    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalled();
    localStorage.setItem.mockRestore();
  });
});
