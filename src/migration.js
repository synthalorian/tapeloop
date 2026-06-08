/**
 * TapeLoop State Migration
 * Versioned localStorage schema with upgrade paths.
 * v0.8.0
 */

export const CURRENT_SCHEMA_VERSION = 3;

const MIGRATION_LOG_KEY = 'TapeLoop_migration_log';
const SCHEMA_VERSION_KEY = 'TapeLoop_schema_version';

const migrations = [
  {
    from: 0,
    to: 1,
    description: 'Initial schema: basic pattern storage',
    migrate: (data) => {
      return {
        version: 1,
        patterns: data.patterns || { A: [], B: [], C: [], D: [] },
        songs: data.songs || Array(16).fill(null),
        padSettings: data.padSettings || [],
        createdAt: Date.now()
      };
    }
  },
  {
    from: 1,
    to: 2,
    description: 'Add probability and parameter locks support',
    migrate: (data) => {
      const normalizePattern = (p) => {
        if (!p || !Array.isArray(p)) return Array.from({length: 4}, () => Array.from({length: 16}, () => ({ active: false, prob: 1.0, locks: {} })));
        return p.map(row => row.map(step => {
          if (typeof step === 'boolean') return { active: step, prob: 1.0, locks: {} };
          return { active: !!step.active, prob: step.prob || 1.0, locks: step.locks || {} };
        }));
      };
      const patterns = {};
      for (const bank of ['A','B','C','D']) {
        patterns[bank] = normalizePattern(data.patterns && data.patterns[bank]);
      }
      return { ...data, version: 2, patterns };
    }
  },
  {
    from: 2,
    to: 3,
    description: 'Add crash recovery metadata and performance settings',
    migrate: (data) => {
      return {
        ...data,
        version: 3,
        meta: {
          migratedAt: Date.now(),
          previousVersion: data.version || 2
        },
        settings: {
          latencyCompensation: data.settings && data.settings.latencyCompensation || 0,
          masterVolume: data.settings && data.settings.masterVolume || 0.8,
          limiter: data.settings && data.settings.limiter || 0.5
        }
      };
    }
  }
];

export function getStoredSchemaVersion() {
  try {
    const raw = localStorage.getItem(SCHEMA_VERSION_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch (e) {
    return 0;
  }
}

export function setStoredSchemaVersion(v) {
  try {
    localStorage.setItem(SCHEMA_VERSION_KEY, String(v));
  } catch (e) {
    // ignore
  }
}

export function getMigrationLog() {
  try {
    const raw = localStorage.getItem(MIGRATION_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addMigrationLogEntry(entry) {
  try {
    const log = getMigrationLog();
    log.push({ ...entry, timestamp: Date.now() });
    localStorage.setItem(MIGRATION_LOG_KEY, JSON.stringify(log.slice(-50)));
  } catch (e) {
    // ignore
  }
}

export function migrateState(data, logger) {
  let currentVersion = data && data.version ? data.version : 0;
  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    return { success: true, data, migrationsRun: 0 };
  }

  let migratedData = data || {};
  let migrationsRun = 0;

  for (const migration of migrations) {
    if (currentVersion === migration.from) {
      try {
        migratedData = migration.migrate(migratedData);
        currentVersion = migration.to;
        migrationsRun++;
        if (logger && logger.info) {
          logger.info(`Migration applied: v${migration.from} -> v${migration.to}: ${migration.description}`);
        }
        addMigrationLogEntry({
          from: migration.from,
          to: migration.to,
          description: migration.description,
          success: true
        });
      } catch (err) {
        if (logger && logger.error) {
          logger.error(`Migration failed: v${migration.from} -> v${migration.to}`, { error: err.message });
        }
        addMigrationLogEntry({
          from: migration.from,
          to: migration.to,
          description: migration.description,
          success: false,
          error: err.message
        });
        return { success: false, data, error: err.message, migrationsRun };
      }
    }
  }

  setStoredSchemaVersion(currentVersion);
  return { success: true, data: migratedData, migrationsRun };
}

export function exportMigratedState(data) {
  return JSON.stringify({
    version: CURRENT_SCHEMA_VERSION,
    exportedAt: Date.now(),
    data
  }, null, 2);
}

export function resetSchema() {
  try {
    localStorage.removeItem(SCHEMA_VERSION_KEY);
    localStorage.removeItem(MIGRATION_LOG_KEY);
  } catch (e) {
    // ignore
  }
}

export { migrations, SCHEMA_VERSION_KEY, MIGRATION_LOG_KEY };
