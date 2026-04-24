const multiLLMModel = require("../models/multiLLMModel");

exports.getMultiResponses = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const responses = multiLLMModel.getMultiResponses(prompt);

    res.status(200).json({
      prompt,
      responses
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get LLM responses" });
  }
};

exports.regenerateResponse = async (req, res) => {
  try {
    const { model, prompt } = req.body;

    if (!model || !prompt) {
      return res.status(400).json({ error: "Model and prompt are required" });
    }

    const regenerated = multiLLMModel.regenerateResponse(model, prompt);

    res.status(200).json(regenerated);
  } catch (err) {
    res.status(500).json({ error: "Failed to regenerate response" });
  }
};

exports.continueWithModel = async (req, res) => {
  try {
    const { model, prompt } = req.body;

    if (!model || !prompt) {
      return res.status(400).json({ error: "Model and prompt are required" });
    }

    const continued = multiLLMModel.continueWithModel(model, prompt);

    res.status(200).json(continued);
  } catch (err) {
    res.status(500).json({ error: "Failed to continue with selected LLM" });
  }
};