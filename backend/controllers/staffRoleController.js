const StaffRole = require('../models/StaffRole');

const getStaffRoles = async (req, res) => {
  try {
    const roles = await StaffRole.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.send(roles);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

const getStaffRole = async (req, res) => {
  try {
    const role = await StaffRole.findByPk(req.params.id);
    if (!role) {
      return res.status(404).send({ error: 'Staff role not found' });
    }
    res.send(role);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

const createStaffRole = async (req, res) => {
  try {
    const { roleName, description, permissions } = req.body;

    // Check if role name already exists
    const existingRole = await StaffRole.findOne({ where: { roleName } });
    if (existingRole) {
      return res.status(400).send({ error: 'A role with this name already exists' });
    }

    const role = await StaffRole.create({
      roleName,
      description,
      permissions,
      isSystemRole: false
    });

    res.status(201).send(role);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const updateStaffRole = async (req, res) => {
  try {
    const role = await StaffRole.findByPk(req.params.id);

    if (!role) {
      return res.status(404).send({ error: 'Staff role not found' });
    }

    // Prevent editing system roles
    if (role.isSystemRole) {
      return res.status(403).send({
        error: 'Cannot edit system roles',
        message: 'System roles are predefined and cannot be modified. Create a custom role instead.'
      });
    }

    const [updatedRowsCount] = await StaffRole.update(req.body, {
      where: { id: req.params.id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).send({ error: 'Staff role not found' });
    }

    const updatedRole = await StaffRole.findByPk(req.params.id);
    res.send(updatedRole);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const deleteStaffRole = async (req, res) => {
  try {
    const role = await StaffRole.findByPk(req.params.id);

    if (!role) {
      return res.status(404).send({ error: 'Staff role not found' });
    }

    // Prevent deleting system roles
    if (role.isSystemRole) {
      return res.status(403).send({
        error: 'Cannot delete system roles',
        message: 'System roles are predefined and cannot be deleted.'
      });
    }

    // Check if any users are using this role
    const User = require('../models/User');
    const usersWithRole = await User.count({ where: { staffRoleId: req.params.id } });

    if (usersWithRole > 0) {
      return res.status(400).send({
        error: 'Cannot delete role',
        message: `This role is assigned to ${usersWithRole} user(s). Reassign them first.`
      });
    }

    await role.destroy();
    res.send({ message: 'Staff role deleted successfully' });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

module.exports = {
  getStaffRoles,
  getStaffRole,
  createStaffRole,
  updateStaffRole,
  deleteStaffRole
};
