const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const userModel = require("../models/userModel");
const authView = require("../views/authView");

// Register a new user
async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json(authView.errorResponse("Username, email, and password are required"));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(authView.errorResponse("Please enter a valid email address"));
    }

    // Check if username is already taken
    const existingUsername = userModel.findUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json(authView.errorResponse("Username is already taken"));
    }

    // Check if email is already registered
    const existingUser = userModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json(authView.errorResponse("User already exists"));
    }

    // Hash the password before saving
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the new user
    const user = userModel.createUser(username, email, passwordHash);

    // Save user to session so they are logged in immediately
    req.session.user = { id: user.id, username: user.username, email: user.email };

    return res.status(201).json(
      authView.successResponse("Account created successfully", { user: req.session.user })
    );
  } catch (error) {
    return res.status(500).json(authView.errorResponse("Server error"));
  }
}

// Log into an existing user account
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(authView.errorResponse("Email and password are required"));
    }

    const user = userModel.findUserByEmail(email);
    if (!user) {
      return res.status(401).json(authView.errorResponse("Invalid credentials"));
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json(authView.errorResponse("Invalid credentials"));
    }

    // Store username, email, and id in session
    req.session.user = { id: user.id, username: user.username, email: user.email };

    return res.status(200).json(
      authView.successResponse("Login successful", { user: req.session.user })
    );
  } catch (error) {
    return res.status(500).json(authView.errorResponse("Server error"));
  }
}

// Log out of current session
function logout(req, res) {
  req.session.destroy(() => {
    return res.status(200).json(authView.successResponse("Logout successful"));
  });
}

// Create a guest session
function guest(req, res) {
  try {
    userModel.logSession(null, true);
    req.session.guest = true;

    return res.status(200).json(
      authView.successResponse("Guest session created", { guest: true })
    );
  } catch (error) {
    return res.status(500).json(authView.errorResponse("Server error"));
  }
}

// Initiate password reset — generate and return a reset token
function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(authView.errorResponse("Email is required"));
    }

    const user = userModel.findUserByEmail(email);
    if (!user) {
      return res.status(404).json(authView.errorResponse("User not found"));
    }

    const token = uuidv4();
    userModel.saveResetToken(user.id, token);

    return res.status(200).json(
      authView.successResponse("Password reset token created", { token })
    );
  } catch (error) {
    return res.status(500).json(authView.errorResponse("Server error"));
  }
}

// Reset password using a valid token
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json(authView.errorResponse("Token and new password are required"));
    }

    const tokenRecord = userModel.findResetToken(token);
    if (!tokenRecord) {
      return res.status(400).json(authView.errorResponse("Invalid or used reset token"));
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    userModel.updatePassword(tokenRecord.user_id, passwordHash);
    userModel.markResetTokenUsed(token);

    return res.status(200).json(authView.successResponse("Password reset successful"));
  } catch (error) {
    return res.status(500).json(authView.errorResponse("Server error"));
  }
}

// Mock CAS login for testing purposes
function casLogin(req, res) {
  try {
    const { netid } = req.query;

    if (!netid) {
      return res.status(400).json(authView.errorResponse("NetID is required"));
    }

    req.session.casUser = { netid };

    return res.status(200).json(
      authView.successResponse("CAS login successful (mock)", { netid })
    );
  } catch (error) {
    return res.status(500).json(authView.errorResponse("Server error"));
  }
}

// Return current session info
function me(req, res) {
  return res.status(200).json(
    authView.successResponse("Current session retrieved", {
      user: req.session.user || null,
      guest: req.session.guest || false,
      casUser: req.session.casUser || null
    })
  );
}

module.exports = {
  register,
  login,
  logout,
  guest,
  forgotPassword,
  resetPassword,
  casLogin,
  me
};