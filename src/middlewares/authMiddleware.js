const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.split(' ')[1] : null;

  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // e.g. { id, role }
    next();
  } catch (err) {
    console.error('JWT verification error:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

exports.requireRole = role => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
  next();
};