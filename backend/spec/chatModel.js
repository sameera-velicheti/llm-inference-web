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
