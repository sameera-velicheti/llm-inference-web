const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { requireAuth } = require("../middleware/authMiddleware");

router.get("/chats", requireAuth, chatController.getUserChats);
router.get("/chats/search", requireAuth, chatController.searchChats);

module.exports = router;
