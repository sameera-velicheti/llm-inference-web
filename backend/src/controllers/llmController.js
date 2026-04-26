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

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};