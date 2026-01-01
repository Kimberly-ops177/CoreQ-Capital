const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StaffRole = sequelize.define('StaffRole', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  roleName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      canViewBorrowers: false,
      canAddBorrowers: false,
      canEditBorrowers: false,
      canDeleteBorrowers: false,
      canViewLoans: false,
      canAddLoans: false,
      canEditLoans: false,
      canDeleteLoans: false,
      canViewCollaterals: false,
      canAddCollaterals: false,
      canEditCollaterals: false,
      canDeleteCollaterals: false,
      canViewExpenses: false,
      canAddExpenses: false,
      canEditExpenses: false,
      canDeleteExpenses: false,
      canViewReports: false,
      canApproveTransactions: false,
      canViewSettings: false,
      canEditSettings: false,
      canViewUsers: false,
      canAddUsers: false,
      canEditUsers: false,
      canDeleteUsers: false
    }
  },
  isSystemRole: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  tableName: 'staff_roles',
  timestamps: false
});

module.exports = StaffRole;
