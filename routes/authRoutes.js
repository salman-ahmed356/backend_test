const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User'); // Import Sequelize User model
const bcrypt = require('bcryptjs');
const { 
    forgotPassword, 
    resetPassword, 
    registerUser, 
    verifyAccount 
} = require('../controllers/authController');
const authMiddleware = require('../middleware/auth'); // Updated middleware
const { editAccount, verifyEmailChange } = require('../controllers/authController');
const router = express.Router();
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with an environment variable

// User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Validate the password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) return res.status(401).json({ message: 'Invalid password' });

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '1h', // Token expiration time
    });

    res.json({ token, user: { username: user.username, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// User registration (points to the `registerUser` function in `authController.js`)
router.post('/register', registerUser);

// Forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password/:token', resetPassword);

// Admin verification response route
router.get('/verify-account', verifyAccount);
router.post('/verify-account/:id/:action', verifyAccount);

// Example of a protected route
router.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});
// Route to edit account details
router.put('/edit-account', authMiddleware, editAccount);

// Route to verify email change
router.get('/verify-email/:token', verifyEmailChange);
module.exports = router;
