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

exports.addMessage = (chatId, role, message) => {
  const stmt = db.prepare(`
    INSERT INTO messages (chat_id, role, message)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(chatId, role, message);
  return { id: result.lastInsertRowid };
};
