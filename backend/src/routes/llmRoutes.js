const express = require('express');
const router = express.Router();

router.post('/multi', (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({
      success: false,
      error: 'Prompt is required'
    });
  }

  const responses = [
    {
      model: 'LLM 1',
      text: `LLM 1 response to: ${prompt}`
    },
    {
      model: 'LLM 2',
      text: `LLM 2 response to: ${prompt}`
    },
    {
      model: 'LLM 3',
      text: `LLM 3 response to: ${prompt}`
    }
  ];

  res.json({
    success: true,
    responses
  });
});

module.exports = router;