/**
 * TapeLoop Logger
 * Lightweight structured logging with levels, in-memory ring buffer, and export.
 * v0.8.0
 */

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

const LEVEL_NAMES = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

class Logger {
  constructor(options = {}) {
    this.level = options.level !== undefined ? options.level : LogLevel.INFO;
    this.maxEntries = options.maxEntries || 500;
    this.entries = [];
    this.sessionStart = Date.now();
    this.onEntry = options.onEntry || null;
    this._counters = { debug: 0, info: 0, warn: 0, error: 0 };
  }

  _push(level, message, meta = {}) {
    if (level < this.level) return;
    const entry = {
      timestamp: Date.now(),
      level: LEVEL_NAMES[level] || 'UNKNOWN',
      message: String(message),
      meta: meta || {}
    };
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
    const key = entry.level.toLowerCase();
    if (this._counters[key] !== undefined) this._counters[key]++;
    if (this.onEntry) {
      try { this.onEntry(entry); } catch (e) { /* ignore callback errors */ }
    }
    // Also mirror ERROR and WARN to console
    if (level === LogLevel.ERROR) console.error(`[TapeLoop] ${entry.message}`, meta);
    else if (level === LogLevel.WARN) console.warn(`[TapeLoop] ${entry.message}`, meta);
    else if (level === LogLevel.DEBUG && typeof console !== 'undefined') console.log(`[TapeLoop] ${entry.message}`, meta);
  }

  debug(msg, meta) { this._push(LogLevel.DEBUG, msg, meta); }
  info(msg, meta) { this._push(LogLevel.INFO, msg, meta); }
  warn(msg, meta) { this._push(LogLevel.WARN, msg, meta); }
  error(msg, meta) { this._push(LogLevel.ERROR, msg, meta); }

  getEntries(filterLevel) {
    if (filterLevel === undefined) return [...this.entries];
    return this.entries.filter(e => LogLevel[e.level] >= filterLevel);
  }

  getRecent(count = 50) {
    return this.entries.slice(-count);
  }

  getCounters() {
    return { ...this._counters };
  }

  clear() {
    this.entries = [];
    this._counters = { debug: 0, info: 0, warn: 0, error: 0 };
  }

  exportJSON() {
    return JSON.stringify({
      sessionStart: this.sessionStart,
      exportedAt: Date.now(),
      counters: this._counters,
      entries: this.entries
    }, null, 2);
  }

  exportBlob() {
    return new Blob([this.exportJSON()], { type: 'application/json' });
  }

  download(filename = 'tapeloop-logs.json') {
    const blob = this.exportBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  setLevel(l) { this.level = l; }
}

export function createLogger(options) {
  return new Logger(options);
}

export default Logger;
