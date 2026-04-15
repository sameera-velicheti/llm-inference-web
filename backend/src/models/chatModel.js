const db = require("../config/db");

exports.getChatsByUser = (userId) => {
  const stmt = db.prepare(`
    SELECT * FROM chats 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `);
  return stmt.all(userId);
};

exports.getMessages = (chatId) => {
  const stmt = db.prepare(`
    SELECT * FROM messages 
    WHERE chat_id = ? 
    ORDER BY created_at ASC
  `);
  return stmt.all(chatId);
};

exports.searchChats = (userId, query) => {
  const stmt = db.prepare(`
    SELECT DISTINCT chats.*
    FROM chats
    LEFT JOIN messages ON messages.chat_id = chats.id
    WHERE chats.user_id = ?
      AND (
        chats.title LIKE ?
        OR messages.message LIKE ?
      )
    ORDER BY chats.created_at DESC
  `);
  return stmt.all(userId, `%${query}%`, `%${query}%`);
};

exports.createChat = (userId, title) => {
  const stmt = db.prepare(`
    INSERT INTO chats (user_id, title)
    VALUES (?, ?)
  `);
  const result = stmt.run(userId, title);
  return { id: result.lastInsertRowid };
};

/**
 * Save a message. model_name is optional (null for user messages,
 * set to e.g. "mistral" for assistant responses).
 */
exports.addMessage = (chatId, role, message, model_name = null) => {
  const stmt = db.prepare(`
    INSERT INTO messages (chat_id, role, message, model_name)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(chatId, role, message, model_name);
  return { id: result.lastInsertRowid };
};

/**
 * Store which model a chat has been pinned to (null = multi-model mode).
 */
exports.setPinnedModel = (chatId, model) => {
  const stmt = db.prepare(`
    UPDATE chats SET pinned_model = ? WHERE id = ?
  `);
  stmt.run(model || null, chatId);
};
