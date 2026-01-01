const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      where: {
        id: decoded.id,
        isActive: true
      }
    });

    if (!user) {
      throw new Error();
    }

    console.log('[auth] User loaded:', {
      id: user.id,
      email: user.email,
      role: user.role,
      assignedLocation: user.assignedLocation
    });

    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send({ error: 'Access denied.' });
  }
  next();
};

const employeeOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'employee') {
    return res.status(403).send({ error: 'Access denied.' });
  }
  next();
};

module.exports = { auth, adminOnly, employeeOrAdmin };