require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db'); 
const logRoutes = require('./routes/logRoutes');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for specified origins
app.use(cors({
    origin: ['https://global-bazaar-frontend.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware for parsing JSON bodies
app.use(express.json());

// Route setup
app.use('/logs', logRoutes);
app.use('/products', productRoutes);
app.use('/auth', authRoutes);

// Health check route
app.get('/', (req, res) => {
    res.send('Global Bazaar backend is running...');
});

// Initialize database connection
sequelize.authenticate()
    .then(() => {
        console.log('Connected to the SQL database successfully.');
        // Sync database models (optional: remove { force: true } in production)
        return sequelize.sync();
    })
    .then(() => {
        // Start the server after database connection
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Database connection error:', error);
    });
    sequelize.sync({ alter: true }) // This will update the database schema without losing data
    .then(() => {
        console.log('Database synchronized successfully.');
    })
    .catch((error) => {
        console.error('Error synchronizing database:', error);
    });
