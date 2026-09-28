const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, 'disasteready.db');
const schemaPath = path.join(__dirname, 'schema.sql');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.exec(fs.readFileSync(schemaPath, 'utf8'));
const usersColumns = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
if (!usersColumns.includes('notifications_enabled')) {
  db.exec('ALTER TABLE users ADD COLUMN notifications_enabled INTEGER NOT NULL DEFAULT 1');
}
module.exports = db;
