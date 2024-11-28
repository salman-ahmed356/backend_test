const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); 
const bcrypt = require('bcryptjs'); // For password hashing

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Ensures the username is unique
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Ensures the email is unique
    validate: {
      isEmail: true, // Ensures the field contains a valid email
    },
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true,
},
resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
},
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Initially set to false
},
role: {
    type: DataTypes.STRING,
    defaultValue: 'user', // Default role is 'user'
},

  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW, // Defaults to the current date and time
  },
}, {
  timestamps: false, // Sequelize auto-generates `createdAt` if not explicitly specified
});

// Hash password before saving the user
User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10); // Hash the password
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10); // Rehash if password is updated
  }
});

// Method to compare passwords
User.prototype.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = { User }; 
