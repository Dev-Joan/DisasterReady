/**
 * ============================================================================
 *  ONE-TIME MIGRATION: rebuild the `alerts` table for the new advisory engine
 * ============================================================================
 * The `alerts` table previously held two hand-written simulated rows (the
 * app's own AlertsScreen labelled them "Simulated alert feed"). This drops
 * that old shape (alert_id, severity, hazard, region, message, active) and
 * lets db/schema.sql's `CREATE TABLE IF NOT EXISTS alerts` recreate it with
 * the new shape used by services/advisoryEngine.js (country, source,
 * generated_at, expires_at, and a CHECK-constrained severity enum).
 *
 * Safe to run because the old table held only disposable placeholder
 * content, not real user data — confirmed by inspection before writing this
 * script (see the session record: exactly rows "a1"/"a2", matching the old
 * data/alerts.json seed file byte for byte).
 *
 * Run with:
 *   node scripts/migrateAlertsSchema.js
 * from the `server` directory. Refuses to run if the table already has the
 * new shape (idempotent / safe to accidentally re-run).
 * ============================================================================
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../db/disasteready.db');
const db = new Database(dbPath);

const columns = db.prepare('PRAGMA table_info(alerts)').all().map((c) => c.name);
const alreadyMigrated = columns.includes('country') && columns.includes('source');

if (alreadyMigrated) {
  console.log('alerts table already has the new shape — nothing to do.');
  process.exit(0);
}

console.log('Old alerts table columns:', columns);
console.log('Old alerts table rows:', JSON.stringify(db.prepare('SELECT * FROM alerts').all()));

db.exec('DROP TABLE alerts');
console.log('\nDropped old alerts table. Run the server (or require db/connection.js) to recreate it from schema.sql.');
