/**
 * ============================================================================
 *  SQLITE CONNECTION
 * ============================================================================
 * Single shared better-sqlite3 database handle for the whole server.
 * better-sqlite3 is synchronous (no callbacks/promises) and runs in-process,
 * which is exactly what a single-process Express app wants: every query is
 * a plain function call, so services read like the JSON-file code they
 * replace, but are now real parameterised SQL against a real schema.
 *
 * `foreign_keys = ON` is set on every connection (SQLite defaults it OFF
 * per-connection for backwards compatibility with pre-3.6.19 databases,
 * which would otherwise silently let the FK constraints in schema.sql do
 * nothing).
 * ============================================================================
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'disasteready.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Idempotent: CREATE TABLE IF NOT EXISTS everywhere in schema.sql, so this
// is safe to run on every server start, not just on first setup.
db.exec(fs.readFileSync(schemaPath, 'utf8'));

module.exports = db;
