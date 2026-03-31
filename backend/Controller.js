const chatModel = require("../models/chatModel");

exports.getUserChats = async (req, res) => {
    try {
        const chats = await chatModel.getChatsByUser(req.session.user.id);
        res.json(chats);
    } catch (err) {
        res.status(500).json({ error: "Failed to load chats" });
    }
};
