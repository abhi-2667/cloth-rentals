const jwt = require('jsonwebtoken');
const User = require('../models/User');
const devStore = require('../utils/devStore');

const useDevStore = !process.env.MONGO_URI;

const getJwtSecret = () => process.env.JWT_SECRET || 'dev-secret';

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

const approvedAccount = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    if (useDevStore) {
      const user = devStore.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.approvalStatus && user.approvalStatus !== 'approved') {
        return res.status(403).json({ message: 'Account pending admin approval' });
      }

      return next();
    }

    const user = await User.findById(userId).select('approvalStatus');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.approvalStatus && user.approvalStatus !== 'approved') {
      return res.status(403).json({ message: 'Account pending admin approval' });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { protect, admin, approvedAccount };
