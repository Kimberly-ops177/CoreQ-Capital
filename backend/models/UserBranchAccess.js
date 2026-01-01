const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserBranchAccess = sequelize.define('UserBranchAccess', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  canView: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  canEdit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  canDelete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_branch_access',
  timestamps: false
});

module.exports = UserBranchAccess;
