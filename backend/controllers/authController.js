const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StaffRole = require('../models/StaffRole');
const { checkLoginRestrictions } = require('../middleware/loginRestrictions');

const toSafeUser = (user) => {
  if (!user) return null;
  const data = typeof user.toJSON === 'function' ? user.toJSON() : user;
  // eslint-disable-next-line no-unused-vars
  const { password, ...safe } = data;
  return safe;
};

const register = async (req, res) => {
  try {
    const { name, email, password, role, permissions, assignedLocation } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);

    // Generate username from email if not provided
    const username = email.split('@')[0];

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      role,
      permissions,
      assignedLocation
    });
    res.status(201).send({ message: 'User created successfully' });
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[auth.login] attempt', { email });

    const user = await User.findOne({
      where: {
        email,
        isActive: true
      },
      include: [
        { model: StaffRole, as: 'staffRole' }
      ]
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.log('[auth.login] invalid credentials', { email, found: !!user });
      return res.status(401).send({ error: 'Invalid credentials' });
    }

    // Check login restrictions
    const restrictionCheck = checkLoginRestrictions(user, req);
    if (!restrictionCheck.allowed) {
      console.log('[auth.login] login restrictions failed', { email, errors: restrictionCheck.errors });
      return res.status(403).send({
        error: 'Login restricted',
        message: restrictionCheck.errors.join('. ')
      });
    }

    // Merge staff role permissions with user permissions if staff role exists
    let finalPermissions = user.permissions || {};
    if (user.staffRole && user.staffRole.permissions) {
      finalPermissions = {
        ...finalPermissions,
        ...user.staffRole.permissions
      };
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    console.log('[auth.login] success', { email });

    const userData = toSafeUser(user);
    userData.permissions = finalPermissions;

    res.send({ user: userData, token });
  } catch (e) {
    console.error('[auth.login] error', e);
    res.status(400).send({ error: e.message });
  }
};

const getProfile = async (req, res) => {
  res.send(toSafeUser(req.user));
};

const updateProfile = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates' });
    }
    await req.user.update(req.body);
    res.send(req.user);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

module.exports = { register, login, getProfile, updateProfile };
