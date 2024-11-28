const express = require('express');
const { Product } = require('../models/Product'); // Import Sequelize Product model
const authMiddleware = require('../middleware/auth'); // Authentication middleware
const { Op } = require('sequelize'); // Sequelize operators

const router = express.Router();

// Add a new product
router.post('/', authMiddleware, async (req, res) => {
  try {
    const product = await Product.create(req.body); // Create a new product
    res.status(201).json(product);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all products
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await Product.findAll(); // Fetch all products
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a product by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id); // Find product by primary key
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a product by ID
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.update(req.body); // Update product details
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a product by ID
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.destroy(); // Delete product
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search products by name
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ message: 'No search term provided' });

    // Search for products with a name matching the query
    const products = await Product.findAll({
      where: { name: { [Op.iLike]: `%${name}%` } }, // Case-insensitive search
    });

    if (!products.length) {
      return res.status(404).json({ message: 'No products found matching the search term' });
    }

    res.json(products);
  } catch (error) {
    console.error('Error searching for product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
