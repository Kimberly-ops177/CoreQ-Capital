const User = require('../models/User');
const StaffRole = require('../models/StaffRole');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        { model: StaffRole, as: 'staffRole', attributes: ['id', 'roleName', 'permissions'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.send(users);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: StaffRole, as: 'staffRole', attributes: ['id', 'roleName', 'permissions'] }
      ]
    });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.send(user);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Hash password if it's being updated
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    } else {
      delete updates.password; // Don't update password if not provided
    }

    const [updatedRowsCount] = await User.update(updates, {
      where: { id: req.params.id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).send({ error: 'User not found' });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: StaffRole, as: 'staffRole', attributes: ['id', 'roleName', 'permissions'] }
      ]
    });
    res.send(user);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deletedRowsCount = await User.destroy({
      where: { id: req.params.id }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).send({ error: 'User not found' });
    }

    res.send({ message: 'User deleted' });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

module.exports = { getUsers, getUser, updateUser, deleteUser };
