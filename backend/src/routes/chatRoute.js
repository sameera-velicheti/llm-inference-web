const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { requireAuth } = require("../middleware/authMiddleware");

router.post("/chats", requireAuth, chatController.createChat);
router.post("/chats/:chatId/messages", requireAuth, chatController.addMessage);
router.get("/chats", requireAuth, chatController.getUserChats);
router.get("/chats/search", requireAuth, chatController.searchChats);

module.exports = router;
