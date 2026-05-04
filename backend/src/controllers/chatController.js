const { getAllLLMResponses } = require("../services/llmAggregator");
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

async function askMultipleLLMs(req, res) {
    try {
        const { chatId, prompt } = req.body;

        // save user message
        await chatModel.addMessage(chatId, "user", prompt);

        // get responses from multiple models
        const responses = await getAllLLMResponses(prompt);

        // save AI responses
        await chatModel.addMessage(chatId, "openai", responses.openai);
        await chatModel.addMessage(chatId, "gemini", responses.gemini);
        await chatModel.addMessage(chatId, "claude", responses.claude);

        res.json(responses);

    } catch (error) {
        res.status(500).json({
            error: "Failed to get LLM responses"
        });
    }
}

module.exports = {
   getUserChats,
   searchChats,
   createChat,
   addMessage,
   askMultipleLLMs
};
