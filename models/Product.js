const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); 

const Product = sequelize.define('Product', {
  name: {
    type: DataTypes.STRING,
    allowNull: false, // Equivalent to `required: true`
  },
  price: {
    type: DataTypes.DECIMAL(10, 2), // Allows for two decimal places
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT, // More suitable for potentially large text
    allowNull: true, // Equivalent to no `required` constraint
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

module.exports = Product;
