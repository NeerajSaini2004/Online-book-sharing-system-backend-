const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Handle mock tokens for test accounts
    if (token.startsWith('mock_token_')) {
      const parts = token.split('_');
      const userId = parts[2];
      // For mock tokens, create a minimal user object
      req.user = { _id: userId, id: userId, name: 'Test User', role: 'student' };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = { protect };
