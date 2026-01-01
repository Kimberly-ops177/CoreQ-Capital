const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomField = sequelize.define('CustomField', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  branchId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  fieldName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fieldLabel: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fieldType: {
    type: DataTypes.ENUM('text', 'number', 'date', 'select', 'checkbox', 'textarea'),
    defaultValue: 'text'
  },
  entityType: {
    type: DataTypes.ENUM('borrower', 'loan', 'collateral'),
    allowNull: false
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  options: {
    type: DataTypes.JSON,
    comment: 'Array of options for select fields'
  },
  defaultValue: {
    type: DataTypes.STRING
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'custom_fields',
  timestamps: false
});

module.exports = CustomField;
