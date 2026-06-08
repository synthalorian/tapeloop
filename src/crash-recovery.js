/**
 * TapeLoop Crash Recovery
 * Auto-saves state snapshots periodically and offers recovery on startup.
 * v0.8.0
 */

const SNAPSHOT_KEY = 'TapeLoop_recovery_snapshot';
const SNAPSHOT_INTERVAL_MS = 30000; // 30 seconds
const MAX_SNAPSHOT_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function createCrashRecovery(logger) {
  let intervalId = null;
  let lastSnapshot = null;

  function now() { return Date.now(); }

  function getSnapshotData() {
    return {
      timestamp: now(),
      version: '0.8.0',
      url: typeof window !== 'undefined' ? window.location.href : null
    };
  }

  function saveSnapshot(stateFn) {
    try {
      const state = typeof stateFn === 'function' ? stateFn() : stateFn;
      const snapshot = {
        meta: getSnapshotData(),
        state: state
      };
      const serialized = JSON.stringify(snapshot);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SNAPSHOT_KEY, serialized);
      }
      lastSnapshot = snapshot;
      if (logger && logger.debug) logger.debug('Crash recovery snapshot saved');
      return true;
    } catch (err) {
      if (logger && logger.error) logger.error('Failed to save crash recovery snapshot', { error: err.message });
      return false;
    }
  }

  function loadSnapshot() {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      if (!raw) return null;
      const snapshot = JSON.parse(raw);
      if (!snapshot || !snapshot.meta || !snapshot.state) return null;
      const age = now() - snapshot.meta.timestamp;
      if (age > MAX_SNAPSHOT_AGE_MS) {
        clearSnapshot();
        return null;
      }
      return snapshot;
    } catch (err) {
      if (logger && logger.error) logger.error('Failed to load crash recovery snapshot', { error: err.message });
      return null;
    }
  }

  function hasRecoverableSnapshot() {
    const snap = loadSnapshot();
    return !!snap;
  }

  function clearSnapshot() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(SNAPSHOT_KEY);
      }
      lastSnapshot = null;
      if (logger && logger.debug) logger.debug('Crash recovery snapshot cleared');
    } catch (err) {
      if (logger && logger.error) logger.error('Failed to clear crash recovery snapshot', { error: err.message });
    }
  }

  function startAutoSave(stateFn, intervalMs = SNAPSHOT_INTERVAL_MS) {
    if (intervalId) return;
    intervalId = setInterval(() => {
      saveSnapshot(stateFn);
    }, intervalMs);
    if (logger && logger.info) logger.info('Crash recovery auto-save started', { intervalMs });
  }

  function stopAutoSave() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      if (logger && logger.info) logger.info('Crash recovery auto-save stopped');
    }
  }

  function getLastSnapshot() {
    return lastSnapshot;
  }

  return {
    saveSnapshot,
    loadSnapshot,
    hasRecoverableSnapshot,
    clearSnapshot,
    startAutoSave,
    stopAutoSave,
    getLastSnapshot,
    SNAPSHOT_KEY,
    SNAPSHOT_INTERVAL_MS,
    MAX_SNAPSHOT_AGE_MS
  };
}

export { SNAPSHOT_KEY, SNAPSHOT_INTERVAL_MS, MAX_SNAPSHOT_AGE_MS };
