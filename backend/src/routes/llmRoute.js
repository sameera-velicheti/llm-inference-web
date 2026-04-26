// backend/src/routes/llmRoute.js

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { listModels, queryLLMs } = require("../controllers/llmController");

// GET  /api/llm/models  — list available models (auth required)
router.get("/models", requireAuth, listModels);

// POST /api/llm/query   — fan-out query to selected models (auth required)
router.post("/query", requireAuth, queryLLMs);

module.exports = router;
