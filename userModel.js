const db = require("../config/db");

function createUser(username, email, passwordHash) {
  const stmt = db.prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)");
  const result = stmt.run(username, email, passwordHash);
  return { id: result.lastInsertRowid, username, email };
}
function findUserByUsername(username) {
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username);
}
function findUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}
function saveResetToken(userId, token) {
  db.prepare("INSERT INTO password_reset_tokens (user_id, token) VALUES (?, ?)").run(userId, token);
}
function findResetToken(token) {
  return db.prepare("SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0").get(token);
}
function markResetTokenUsed(token) {
  db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE token = ?").run(token);
}
function updatePassword(userId, passwordHash) {
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, userId);
}
function logSession(userId, isGuest) {
  db.prepare("INSERT INTO sessions_log (user_id, is_guest) VALUES (?, ?)").run(userId, isGuest ? 1 : 0);
}

module.exports = { createUser, findUserByUsername, findUserByEmail, saveResetToken, findResetToken, markResetTokenUsed, updatePassword, logSession };
