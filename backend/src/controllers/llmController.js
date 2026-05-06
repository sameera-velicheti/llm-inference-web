const llmService = require("../services/llmService");

exports.getModels = (req, res) => {
  res.json({
    success: true,
    models: llmService.getAvailableModels()
  });
};

exports.generateChatResponse = async (req, res) => {
  try {
    const { prompt, modelId, mode, history } = req.body;

    const result = await llmService.generateResponse({
      prompt,
      modelId,
      mode,
      history
    });

    res.json({ success: true, ...result });

  } catch (err) {
    // Return a 200 with success:false so the frontend can display the
    // error message directly in the chat bubble rather than crashing
    res.status(200).json({
      success: false,
      response: err.message,
      fallback: true
    });
  }
};
