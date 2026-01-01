const CustomField = require('../models/CustomField');

const getCustomFields = async (req, res) => {
  try {
    const { branchId, entityType } = req.query;
    const whereClause = { isActive: true };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    if (entityType) {
      whereClause.entityType = entityType;
    }

    const fields = await CustomField.findAll({
      where: whereClause,
      order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']]
    });

    res.send(fields);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

const getCustomField = async (req, res) => {
  try {
    const field = await CustomField.findByPk(req.params.id);

    if (!field) {
      return res.status(404).send({ error: 'Custom field not found' });
    }

    res.send(field);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

const createCustomField = async (req, res) => {
  try {
    const {
      branchId,
      fieldName,
      fieldLabel,
      fieldType,
      entityType,
      isRequired,
      options,
      defaultValue,
      displayOrder
    } = req.body;

    const field = await CustomField.create({
      branchId,
      fieldName,
      fieldLabel,
      fieldType: fieldType || 'text',
      entityType,
      isRequired: isRequired || false,
      options,
      defaultValue,
      displayOrder: displayOrder || 0
    });

    res.status(201).send(field);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const updateCustomField = async (req, res) => {
  try {
    const [updatedRowsCount] = await CustomField.update(req.body, {
      where: { id: req.params.id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).send({ error: 'Custom field not found' });
    }

    const field = await CustomField.findByPk(req.params.id);
    res.send(field);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const deleteCustomField = async (req, res) => {
  try {
    // Soft delete by setting isActive to false
    const [updatedRowsCount] = await CustomField.update(
      { isActive: false },
      { where: { id: req.params.id } }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).send({ error: 'Custom field not found' });
    }

    res.send({ message: 'Custom field deleted successfully' });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

module.exports = {
  getCustomFields,
  getCustomField,
  createCustomField,
  updateCustomField,
  deleteCustomField
};
