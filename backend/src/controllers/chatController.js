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

exports.createChat = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { title } = req.body;
    const chat = chatModel.createChat(userId, title);
    res.json({ chatId: chat.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create chat" });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { role, message } = req.body;

    await chatModel.addMessage(chatId, role, message);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save message" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = chatModel.getMessages(chatId);

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load messages" });
  }
};
