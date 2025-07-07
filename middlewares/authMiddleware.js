const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('❌ No auth header');
      return res.status(401).json({ message: 'No auth header' });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log('❌ Token missing');
      return res.status(401).json({ message: 'Token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      console.log('❌ User not found for decoded token');
      return res.status(401).json({ message: 'Invalid token user' });
    }

    console.log(`✅ Authenticated as ${req.user.email} (${req.user.role})`);
    next();
  } catch (err) {
    console.error('❌ JWT error:', err.message);
    return res.status(401).json({ message: 'Not authorized', error: err.message });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
};

const hodOnly = (req, res, next) => {
  if (req.user?.role !== 'hod') {
    return res.status(403).json({ message: 'HOD access only' });
  }
  next();
};

module.exports = { protect, adminOnly, hodOnly };
