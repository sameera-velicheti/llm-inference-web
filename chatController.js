const chatModel = require("../models/chatModel");
const { MODELS, streamFromModel } = require("../services/llmService");

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
    const chats = await chatModel.searchChats(req.session.user.id, query);
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
    res.status(500).json({ error: "Failed to create chat" });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { role, message, model_name } = req.body;
    await chatModel.addMessage(chatId, role, message, model_name || null);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save message" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = chatModel.getMessages(chatId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
};

/**
 * GET /api/chats/:chatId/stream?message=...&pinnedModel=...
 *
 * Server-Sent Events endpoint. Streams responses from all 3 Ollama models
 * in parallel. Each SSE event is a JSON object:
 *   { model, token }        — a streamed token chunk
 *   { model, done, saved_message_id }  — model finished
 *   { model, error }        — model failed
 *
 * If pinnedModel is set, only that model is queried (post-transfer mode).
 *
 * The user message is saved before streaming starts.
 * Each assistant response is saved to messages once complete.
 */
exports.streamMultiModel = async (req, res) => {
  const { chatId } = req.params;
  const { message, pinnedModel } = req.query;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  // --- Determine user id (works for both auth users and guests) ---
  const userId = req.session?.user?.id || null;

  // --- For authenticated users with a real chatId, save user message first ---
  const isRealChat = userId && chatId !== "guest" && !isNaN(parseInt(chatId));
  if (isRealChat) {
    chatModel.addMessage(chatId, "user", message, null);
  }

  // --- Set up SSE headers ---
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // --- Decide which models to query ---
  const modelsToQuery = pinnedModel ? [pinnedModel] : MODELS;

  // --- Build message history for context ---
  let history = [];
  if (isRealChat) {
    try {
      const saved = chatModel.getMessages(chatId);
      // exclude the message we just saved (last one) to avoid duplication
      history = saved.slice(0, -1);
    } catch {
      history = [];
    }
  }

  // Append the new user message to history for context
  const contextMessages = [...history, { role: "user", message }];

  // --- Stream all models in parallel ---
  let finished = 0;

  for (const model of modelsToQuery) {
    let fullText = "";

    streamFromModel(
      model,
      contextMessages,
      // onToken
      (token) => {
        sendEvent({ model, token });
      },
      // onDone
      (text) => {
        fullText = text;
        let savedId = null;

        // Save assistant response to DB (only for real authenticated chats)
        if (isRealChat) {
          try {
            const result = chatModel.addMessage(chatId, "assistant", fullText, model);
            savedId = result?.id || null;
          } catch (e) {
            console.error(`Failed to save message for ${model}:`, e);
          }
        }

        sendEvent({ model, done: true, saved_message_id: savedId });

        finished++;
        if (finished === modelsToQuery.length) {
          res.end();
        }
      },
      // onError
      (err) => {
        console.error(`Model ${model} error:`, err.message);
        sendEvent({ model, error: err.message });

        finished++;
        if (finished === modelsToQuery.length) {
          res.end();
        }
      }
    );
  }
};

/**
 * POST /api/chats/:chatId/pin
 * Body: { model: "mistral" }
 *
 * Saves the pinned model for a chat so the UI can restore it on reload.
 */
exports.pinModel = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { model } = req.body;
    chatModel.setPinnedModel(chatId, model || null);
    res.json({ success: true, model: model || null });
  } catch (err) {
    res.status(500).json({ error: "Failed to pin model" });
  }
};
