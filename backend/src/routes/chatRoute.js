const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { requireAuth } = require("../middleware/authMiddleware");

router.get("/chats", requireAuth, chatController.getUserChats);
router.get("/chats/search", requireAuth, chatController.searchChats);
router.get("/chats/:chatId/messages", requireAuth, chatController.getMessages);
router.post("/chats", requireAuth, chatController.createChat);
router.post("/chats/:chatId/messages", requireAuth, chatController.addMessage);

module.exports = router;
