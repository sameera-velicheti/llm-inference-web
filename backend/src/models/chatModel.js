const db = require("../config/db");

exports.getChatsByUser = (userId) => {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT * FROM chats WHERE user_id = ? ORDER BY created_at DESC",
            [userId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
};

exports.getMessages = (chatId) => {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT * FROM messages WHERE chat_id = ?",
            [chatId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
};

exports.searchChats = (userId, query) => {
  return new Promise((resolve, reject) => {

    const sql = `
      SELECT DISTINCT chats.id, chats.title
      FROM chats
      LEFT JOIN messages ON messages.chat_id = chats.id
      WHERE chats.user_id = ?
      AND (
        chats.title LIKE ?
        OR messages.message LIKE ?
      )
      ORDER BY chats.created_at DESC
    `;

    db.all(
      sql,
      [userId, `%${query}%`, `%${query}%`],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );

  });
};
