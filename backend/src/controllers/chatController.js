const chatModel = require("../models/chatModel");

exports.getUserChats = async (req, res) => {
    try {
        const chats = await chatModel.getChatsByUser(req.session.user.id);
        res.json(chats);
    } catch (err) {
        res.status(500).json({ error: "Failed to load chats" });
    }
};

exports.searchChats = async (req, res) => {
  try {
    const query = req.query.q;

    const chats = await chatModel.searchChats(
      req.session.user.id,
      query
    );

    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
};
