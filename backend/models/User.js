const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'employee'),
    allowNull: false
  },
  assignedLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  branch: {
    type: DataTypes.STRING,
    allowNull: true
  },
  canAccessAllBranches: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  staffRoleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'staff_roles',
      key: 'id'
    }
  },
  allowedWorkDays: {
    type: DataTypes.JSON,
    allowNull: true
  },
  allowedIPAddresses: {
    type: DataTypes.JSON,
    allowNull: true
  },
  allowedCountries: {
    type: DataTypes.JSON,
    allowNull: true
  },
  canBackdate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  canPostdate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  repaymentsRequireApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  savingsRequireApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      canAddExpense: false,
      canViewAllLocations: false,
      canEditAllLocations: false,
      canViewBorrowers: true,
      canAddBorrowers: true,
      canEditBorrowers: true,
      canDeleteBorrowers: false,
      canViewLoans: true,
      canAddLoans: true,
      canEditLoans: true,
      canDeleteLoans: false,
      canViewCollaterals: true,
      canAddCollaterals: true,
      canEditCollaterals: true,
      canDeleteCollaterals: false,
      canViewExpenses: false,
      canAddExpenses: false,
      canEditExpenses: false,
      canDeleteExpenses: false,
      canViewReports: true,
      canApproveTransactions: false,
      canViewSettings: false,
      canEditSettings: false,
      canViewUsers: false,
      canAddUsers: false,
      canEditUsers: false,
      canDeleteUsers: false
    }
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
  tableName: 'users',
  timestamps: false
});

module.exports = User;