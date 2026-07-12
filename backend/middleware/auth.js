const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'casmart_super_secret_change_in_production';

/**
 * Middleware: verifies Bearer JWT token in Authorization header.
 * Sets req.user = { id, name, email } on success.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please login again.' });
  }
}

/**
 * Middleware: verifies if the authenticated user has admin role.
 * Must be used AFTER verifyToken.
 */
function verifyAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }
  next();
}

module.exports = { verifyToken, verifyAdmin, JWT_SECRET };
