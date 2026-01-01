const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Settings = sequelize.define('Settings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  interestRates: {
    type: DataTypes.JSON,
    defaultValue: {
      1: 20, // 1 week
      2: 28, // 2 weeks
      3: 32, // 3 weeks
      4: 35  // 4 weeks
    }
  },
  penaltyFee: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 3
  },
  gracePeriod: {
    type: DataTypes.INTEGER,
    defaultValue: 7
  },
  loanThreshold: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 12000
  },
  negotiableThreshold: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 50000
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'settings',
  timestamps: false
});

module.exports = Settings;