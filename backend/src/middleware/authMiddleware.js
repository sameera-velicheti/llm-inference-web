function requireAuth(req, res, next) {

    // If a logged in user, CAS user, or guest session exists
    if (req.session.user || req.session.casUser || req.session.guest) {
      return next(); // allow request to continue
    }
  
    // If no valid session exists, block the request
    return res.status(401).json({
      success: false,
      error: "Unauthorized access"
    });
  }
  
  module.exports = { requireAuth };