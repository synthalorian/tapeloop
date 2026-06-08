/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  migrateState,
  CURRENT_SCHEMA_VERSION,
  getStoredSchemaVersion,
  setStoredSchemaVersion,
  resetSchema
} from '../src/migration.js';

describe('Migration', () => {
  let logger;

  beforeEach(() => {
    localStorage.clear();
    logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() };
  });

  it('getStoredSchemaVersion returns 0 when unset', () => {
    expect(getStoredSchemaVersion()).toBe(0);
  });

  it('setStoredSchemaVersion stores version', () => {
    setStoredSchemaVersion(3);
    expect(getStoredSchemaVersion()).toBe(3);
  });

  it('migrateState upgrades v0 to current', () => {
    const oldState = {
      patterns: { A: [[false, true]], B: [], C: [], D: [] },
      songs: Array(16).fill(null),
      padSettings: []
    };
    const result = migrateState(oldState, logger);
    expect(result.success).toBe(true);
    expect(result.data.version).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.migrationsRun).toBeGreaterThan(0);
  });

  it('migrateState normalizes boolean patterns', () => {
    const oldState = {
      version: 1,
      patterns: {
        A: [
          [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false]
        ]
      },
      songs: Array(16).fill(null),
      padSettings: []
    };
    const result = migrateState(oldState, logger);
    expect(result.success).toBe(true);
    const step = result.data.patterns.A[0][0];
    expect(step.active).toBe(true);
    expect(step.prob).toBe(1.0);
    expect(step.locks).toEqual({});
  });

  it('migrateState adds meta and settings at v3', () => {
    const oldState = {
      version: 2,
      patterns: { A: [], B: [], C: [], D: [] },
      songs: Array(16).fill(null),
      padSettings: []
    };
    const result = migrateState(oldState, logger);
    expect(result.success).toBe(true);
    expect(result.data.meta).toBeDefined();
    expect(result.data.meta.migratedAt).toBeDefined();
    expect(result.data.settings).toBeDefined();
    expect(result.data.settings.masterVolume).toBe(0.8);
  });

  it('returns success for already-current version', () => {
    const state = { version: CURRENT_SCHEMA_VERSION, patterns: {} };
    const result = migrateState(state, logger);
    expect(result.success).toBe(true);
    expect(result.migrationsRun).toBe(0);
  });

  it('resetSchema clears version and log', () => {
    setStoredSchemaVersion(3);
    resetSchema();
    expect(getStoredSchemaVersion()).toBe(0);
  });

  it('handles missing data gracefully', () => {
    const result = migrateState(null, logger);
    expect(result.success).toBe(true);
    expect(result.data.version).toBe(CURRENT_SCHEMA_VERSION);
  });
});
