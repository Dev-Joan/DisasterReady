const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../db/disasteready.db');
const db = new Database(dbPath);
const columns = db.prepare('PRAGMA table_info(alerts)').all().map(c => c.name);
const alreadyMigrated = columns.includes('country') && columns.includes('source');
if (alreadyMigrated) {
  console.log('alerts table already has the new shape - nothing to do.');
  process.exit(0);
}
console.log('Old alerts table columns:', columns);
console.log('Old alerts table rows:', JSON.stringify(db.prepare('SELECT * FROM alerts').all()));
db.exec('DROP TABLE alerts');
console.log('\nDropped old alerts table. Run the server (or require db/connection.js) to recreate it from schema.sql.');
