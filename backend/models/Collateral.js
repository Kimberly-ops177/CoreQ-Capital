const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Collateral = sequelize.define('Collateral', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  borrowerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'borrowers',
      key: 'id'
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  itemName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  modelNumber: {
    type: DataTypes.STRING
  },
  serialNumber: {
    type: DataTypes.STRING
  },
  itemCondition: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('held', 'returned', 'seized', 'sold'),
    defaultValue: 'held',
    comment: 'held=with lender, returned=loan repaid, seized=defaulted, sold=sold after seizure'
  },
  isSeized: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isSold: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  soldPrice: {
    type: DataTypes.DECIMAL(10, 2)
  },
  soldDate: {
    type: DataTypes.DATE
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
  tableName: 'collaterals',
  timestamps: false
});

module.exports = Collateral;