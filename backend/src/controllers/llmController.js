// backend/src/controllers/llmController.js
// Business logic for LLM-related endpoints.

const { getAvailableModels, queryModels } = require("../models/llmModel");
const { getMessages, addMessage } = require("../models/chatModel");

/**
 * GET /api/llm/models
 * Returns the list of models the server can query.
 */
async function listModels(req, res) {
  try {
    const models = getAvailableModels();
    return res.status(200).json({ success: true, models });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to retrieve model list." });
  }
}

/**
 * POST /api/llm/query
 * Body: { chatId, modelIds: string[], userMessage: string }
 *
 * 1. Fetches the existing conversation history for context.
 * 2. Fans out the query to each requested model in parallel.
 * 3. Stores the user message once, then stores each model response as a
 *    separate assistant message tagged with the model name.
 * 4. Returns all model responses so the frontend can render them as cards.
 */
async function queryLLMs(req, res) {
  const { chatId, modelIds, userMessage } = req.body;
  const userId = req.session?.user?.id ?? null;

  // --- Validation ---
  if (!chatId || !userMessage || !Array.isArray(modelIds) || modelIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: "chatId, userMessage, and a non-empty modelIds array are required.",
    });
  }

  if (typeof userMessage !== "string" || userMessage.trim() === "") {
    return res.status(400).json({ success: false, error: "userMessage must be a non-empty string." });
  }

  const MAX_MODELS = 5;
  if (modelIds.length > MAX_MODELS) {
    return res.status(400).json({
      success: false,
      error: `You may query at most ${MAX_MODELS} models at once.`,
    });
  }

  const available = getAvailableModels().map((m) => m.id);
  const invalid = modelIds.filter((id) => !available.includes(id));
  if (invalid.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Unknown model(s): ${invalid.join(", ")}`,
    });
  }

  try {
    // Build conversation history for context
    const history = getMessages(chatId);
    const contextMessages = history.map((row) => ({
      role: row.role === "user" ? "user" : "assistant",
      content: row.message,
    }));
    contextMessages.push({ role: "user", content: userMessage.trim() });

    // Persist the user message
    addMessage(chatId, "user", userMessage.trim(), null);

    // Fan out to all requested models
    const results = await queryModels(modelIds, contextMessages);

    // Persist each model's response
    for (const result of results) {
      if (result.text) {
        addMessage(chatId, "assistant", result.text, result.modelId);
      }
    }

    return res.status(200).json({ success: true, responses: results });
  } catch (err) {
    console.error("queryLLMs error:", err);
    return res.status(500).json({ success: false, error: "Internal server error during LLM query." });
  }
}

module.exports = { listModels, queryLLMs };
