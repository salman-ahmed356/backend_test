const jwt = require('jsonwebtoken');
const { User } = require('../models/User'); // Import Sequelize User model
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with an environment variable in production
const express = require('express');
const cors = require('cors');

const app = express();

// Allow CORS for specified origins and methods
app.use(cors({
  origin: ['http://localhost:3000', 'https://global-bazaar-frontend.vercel.app'], // Allow frontend on Vercel
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'] // Ensure Authorization header is allowed
}));

// Middleware for parsing JSON bodies
app.use(express.json());

// Authentication middleware with user validation
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Expecting "Bearer TOKEN"
  if (!token) return res.status(401).json({ message: 'Access denied, no token provided' });

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if the user exists in the database
    const user = await User.findByPk(decoded.userId); // Assuming `userId` is stored in the token payload
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = decoded; // Attach decoded user data to the request
    next();
  } catch (error) {
    console.error('Error validating token or user:', error);
    res.status(400).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
