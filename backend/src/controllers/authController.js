const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const userModel = require("../models/userModel");
const authView = require("../views/authView");

// Register a new user 
async function register(req, res) {
  try {
    const { email, password } = req.body;  // Get email and password from request

    if (!email || !password) {
      return res.status(400).json(authView.errorResponse("Email and password are required"));
    }

    // Check if user already exists in database
    const existingUser = userModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json(authView.errorResponse("User already exists"));
    }

    // Hash the password for security before saving it 
    const passwordHash = await bcrypt.hash(password, 10);
   
   // Create the new user in the database
    const user = userModel.createUser(email, passwordHash);

    // Log the new session, and save the user so they stay logged in
    req.session.user = user;

    return res.status(201).json(
      authView.successResponse("Account created successfully", { user })
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

    req.session.user = { id: user.id, email: user.email };

    return res.status(200).json(
      authView.successResponse("Login successful", {
        user: { id: user.id, email: user.email }
      })
    );
  } catch (error) {
    return res.status(500).json(authView.errorResponse("Server error"));
  }
}

// Log out of curren user 
function logout(req, res) {
  req.session.destroy(() => {
    return res.status(200).json(authView.successResponse("Logout successful"));
  });
}

// Create a guest session
function guest(req, res) {
  try {
    // Log guest session in database
    userModel.logSession(null, true);

    // Mark and save guest session
    req.session.guest = true;

    return res.status(200).json(
      authView.successResponse("Guest session created", { guest: true })
    );
  } catch (error) {
    return res.status(500).json(authView.errorResponse("Server error"));
  }
}

// Password reset process
function forgotPassword(req, res) {
  try {
    const { email } = req.body; // Get email from request 

    if (!email) {
      return res.status(400).json(authView.errorResponse("Email is required"));
    }

    const user = userModel.findUserByEmail(email);
    if (!user) {
      return res.status(404).json(authView.errorResponse("User not found"));
    }

    // Create unique reset token
    const token = uuidv4();
    userModel.saveResetToken(user.id, token);

    // Return the token
    return res.status(200).json(
      authView.successResponse("Password reset token created", { token })
    );
  } catch (error) {
    return res.status(500).json(authView.errorResponse("Server error"));
  }
}

// Reset the password using the token 
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
    // Get netid 
    const { netid } = req.query;

    // Ensure netid exists 
    if (!netid) {
      return res.status(400).json(authView.errorResponse("NetID is required"));
    }

     // Save CAS user 
    req.session.casUser = { netid };

    return res.status(200).json(
      authView.successResponse("CAS login successful (mock)", { netid })
    );
  } catch (error) {
    return res.status(500).json(authView.errorResponse("Server error"));
  }
}

// Return current session info (User, guest, CAS user)
function me(req, res) {
  return res.status(200).json(
    authView.successResponse("Current session retrieved", {
      user: req.session.user || null,
      guest: req.session.guest || false,
      casUser: req.session.casUser || null
    })
  );
}

// Export controller functions for use in routes 
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