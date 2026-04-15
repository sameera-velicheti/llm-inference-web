// Import Express framework and auth controller functions
const { requireAuth } = require("../middleware/authMiddleware");
const express = require("express");
const authController = require("../controllers/authController");
import { Ollama } from 'ollama';

// Create a router object
const router = express.Router();

router.post("/register", authController.register); // route for account registration
router.post("/login", authController.login); // route for login
router.post("/logout", authController.logout); // route for logout 
router.post("/guest", authController.guest); // route for guest access
router.post("/forgot-password", authController.forgotPassword); // route to request password reset token
router.post("/reset-password", authController.resetPassword); // route to reset password 
router.get("/cas/login", authController.casLogin); // route for mock CAS login 
router.get("/me", authController.me); // route to see session info 

module.exports = router;
