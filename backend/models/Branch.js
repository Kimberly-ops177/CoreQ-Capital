const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Branch = sequelize.define('Branch', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  branchName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  branchCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  location: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.TEXT
  },
  phone: {
    type: DataTypes.STRING(50)
  },
  email: {
    type: DataTypes.STRING
  },
  managerName: {
    type: DataTypes.STRING
  },
  minLoanAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1000
  },
  maxLoanAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 100000
  },
  minInterestRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 5.00
  },
  maxInterestRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 30.00
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
  tableName: 'branches',
  timestamps: false
});

module.exports = Branch;
