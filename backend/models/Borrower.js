const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Borrower = sequelize.define('Borrower', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  idNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apartment: {
    type: DataTypes.STRING
  },
  houseNumber: {
    type: DataTypes.STRING
  },
  isStudent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  institution: {
    type: DataTypes.STRING
  },
  registrationNumber: {
    type: DataTypes.STRING
  },
  emergencyNumber: {
    type: DataTypes.STRING
  },
  // Loan history tracking for second-time loan benefits
  totalLoans: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total number of loans taken by this borrower'
  },
  loansRepaid: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of loans successfully repaid'
  },
  loansDefaulted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of loans that defaulted'
  },
  lastLoanDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date of most recent loan'
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
  tableName: 'borrowers',
  timestamps: false
});

module.exports = Borrower;