const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BranchCapital = sequelize.define('BranchCapital', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  capitalType: {
    type: DataTypes.ENUM('initial', 'addition', 'withdrawal'),
    defaultValue: 'addition'
  },
  description: {
    type: DataTypes.TEXT
  },
  addedBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  transactionDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'branch_capital',
  timestamps: false
});

module.exports = BranchCapital;
