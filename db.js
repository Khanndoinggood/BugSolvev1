const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT
    )
  `);

  // History table
  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      language TEXT,
      original_code TEXT,
      refactored_code TEXT,
      bugs TEXT,
      explanation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Migration: Add refactored_code_no_comments if it doesn't exist
  db.all("PRAGMA table_info(history)", (err, rows) => {
    if (err) return console.error('Migration check failed:', err);
    const hasColumn = rows.some(row => row.name === 'refactored_code_no_comments');
    if (!hasColumn) {
      db.run("ALTER TABLE history ADD COLUMN refactored_code_no_comments TEXT", (err) => {
        if (err) console.error('Migration failed:', err.message);
        else console.log('Migration successful: Added refactored_code_no_comments column.');
      });
    }
  });
});

// Helper functions (Promisified)
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

module.exports = {
  query,
  run
};
