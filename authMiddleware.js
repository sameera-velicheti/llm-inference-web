function requireAuth(req, res, next) {
  if (req.session.user || req.session.casUser || req.session.guest) {
    return next();
  }
  return res.status(401).json({ success: false, error: "Unauthorized access" });
}
module.exports = { requireAuth };
