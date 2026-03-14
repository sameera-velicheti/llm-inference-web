// Import SQLite package and path
const Database = require("better-sqlite3");
const path = require("path");

// Create and open the SQLite database
const dbPath = path.join(__dirname, "../../database/app.db");
const db = new Database(dbPath);

// SQL commands to create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- unique user id
    username TEXT UNIQUE NOT NULL,        -- unique display name
    email TEXT UNIQUE NOT NULL,           -- user email, must be unique
    password_hash TEXT NOT NULL,          -- hashed password for security
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,            -- connects token to user
    token TEXT NOT NULL,                 -- reset token string
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sessions_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    is_guest INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;