const db = require("../config/db"); // Import database connection

// Insert a new user into database
function createUser(email, passwordHash) { 
  const stmt = db.prepare(`
    INSERT INTO users (email, password_hash)
    VALUES (?, ?)
  `);
  const result = stmt.run(email, passwordHash);

  // Return the new user's ID and email
  return { id: result.lastInsertRowid, email };
}

// Find a user by their email address
function findUserByEmail(email) {
  const stmt = db.prepare(`
    SELECT * FROM users WHERE email = ?
  `);
  return stmt.get(email);
}

// Save a password reset token for a user 
function saveResetToken(userId, token) {
  const stmt = db.prepare(`
    INSERT INTO password_reset_tokens (user_id, token)
    VALUES (?, ?)
  `);
  stmt.run(userId, token);
}

// Find a reset token if exists
function findResetToken(token) {
  const stmt = db.prepare(`
    SELECT * FROM password_reset_tokens
    WHERE token = ? AND used = 0
  `);
  return stmt.get(token);
}

// Mark a reset token as used after password reset
function markResetTokenUsed(token) {
  const stmt = db.prepare(`
    UPDATE password_reset_tokens
    SET used = 1
    WHERE token = ?
  `);
  stmt.run(token);
}

// Update password in database 
function updatePassword(userId, passwordHash) {
  const stmt = db.prepare(`
    UPDATE users
    SET password_hash = ?
    WHERE id = ?
  `);
  stmt.run(passwordHash, userId);
}

function logSession(userId, isGuest) {
  const stmt = db.prepare(`
    INSERT INTO sessions_log (user_id, is_guest)
    VALUES (?, ?)
  `);
  stmt.run(userId, isGuest ? 1 : 0);
}

// Export all functions for use in other parts of the application
module.exports = {
  createUser,
  findUserByEmail,
  saveResetToken,
  findResetToken,
  markResetTokenUsed,
  updatePassword,
  logSession
};