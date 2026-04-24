const express = require("express");
const router = express.Router();

const multiLLMController = require("../controllers/multiLLMController");
const { requireAuth } = require("../middleware/authMiddleware");

router.post("/llm/multi", requireAuth, multiLLMController.getMultiResponses);
router.post("/llm/regenerate", requireAuth, multiLLMController.regenerateResponse);
router.post("/llm/continue", requireAuth, multiLLMController.continueWithModel);

module.exports = router;