/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createLogger, LogLevel } from '../src/logger.js';

describe('Logger', () => {
  let logger;

  beforeEach(() => {
    logger = createLogger({ level: LogLevel.DEBUG, maxEntries: 10 });
  });

  it('creates a logger with default settings', () => {
    expect(logger).toBeDefined();
    expect(logger.getEntries()).toEqual([]);
  });

  it('logs entries at different levels', () => {
    logger.debug('debug msg');
    logger.info('info msg');
    logger.warn('warn msg');
    logger.error('error msg');
    const entries = logger.getEntries();
    expect(entries.length).toBe(4);
    expect(entries[0].level).toBe('DEBUG');
    expect(entries[1].level).toBe('INFO');
    expect(entries[2].level).toBe('WARN');
    expect(entries[3].level).toBe('ERROR');
  });

  it('respects log level filtering', () => {
    logger.setLevel(LogLevel.WARN);
    logger.debug('should not appear');
    logger.info('should not appear');
    logger.warn('should appear');
    logger.error('should appear');
    const entries = logger.getEntries();
    expect(entries.length).toBe(2);
    expect(entries[0].level).toBe('WARN');
    expect(entries[1].level).toBe('ERROR');
  });

  it('stores metadata with log entries', () => {
    logger.info('test', { key: 'value' });
    const entries = logger.getEntries();
    expect(entries[0].meta).toEqual({ key: 'value' });
  });

  it('limits entries to maxEntries', () => {
    for (let i = 0; i < 15; i++) {
      logger.info(`msg ${i}`);
    }
    expect(logger.getEntries().length).toBe(10);
    expect(logger.getEntries()[0].message).toBe('msg 5');
  });

  it('getRecent returns last N entries', () => {
    for (let i = 0; i < 5; i++) {
      logger.info(`msg ${i}`);
    }
    const recent = logger.getRecent(3);
    expect(recent.length).toBe(3);
    expect(recent[0].message).toBe('msg 2');
  });

  it('getCounters tracks counts by level', () => {
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    logger.error('e2');
    const counters = logger.getCounters();
    expect(counters.debug).toBe(1);
    expect(counters.info).toBe(1);
    expect(counters.warn).toBe(1);
    expect(counters.error).toBe(2);
  });

  it('clear resets entries and counters', () => {
    logger.info('test');
    logger.clear();
    expect(logger.getEntries().length).toBe(0);
    expect(logger.getCounters().info).toBe(0);
  });

  it('exportJSON produces valid JSON', () => {
    logger.info('test');
    const json = logger.exportJSON();
    const parsed = JSON.parse(json);
    expect(parsed.entries.length).toBe(1);
    expect(parsed.counters.info).toBe(1);
    expect(parsed.sessionStart).toBeDefined();
    expect(parsed.exportedAt).toBeDefined();
  });

  it('getEntries filters by level', () => {
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    const filtered = logger.getEntries(LogLevel.WARN);
    expect(filtered.length).toBe(2);
    expect(filtered[0].level).toBe('WARN');
    expect(filtered[1].level).toBe('ERROR');
  });
});
