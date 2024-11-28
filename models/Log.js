const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); 

const Log = sequelize.define('Log', {
  action: {
    type: DataTypes.ENUM('ADD', 'UPDATE', 'DELETE'),
    allowNull: false,
    validate: {
      isIn: [['ADD', 'UPDATE', 'DELETE']], // Ensures valid actions
    },
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true, // Optional field
  },
  price: {
    type: DataTypes.DECIMAL(10, 2), // Allows price with two decimal places
    allowNull: false,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

module.exports = Log;
