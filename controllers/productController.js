const { Product } = require('../models/Product'); // Import Sequelize Product model
const { Log } = require('../models/Log'); // Import Sequelize Log model
const { Parser } = require('json2csv');
const { Op } = require('sequelize');

const LOW_STOCK_THRESHOLD = 3; // Low stock threshold setting

// Helper function to log actions
async function logAction(action, product) {
  await Log.create({
    action,
    productName: product.name,
    price: product.price, // Include price in log
    quantity: product.quantity,
    description: product.description,
  });
}

// Add Product
exports.addProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body); // Add product
    await logAction('ADD', product); // Log the add action
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error adding product', error });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll(); // Retrieve all products
    const formattedProducts = products.map(product => ({
      ...product.dataValues,
      price: parseFloat(product.price).toFixed(2), // Format price to two decimal places
    }));
    res.json(formattedProducts);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving products', error });
  }
};

// Get a product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id); // Retrieve product by primary key
    if (!product) return res.status(404).json({ message: 'Product not found' });
    product.price = parseFloat(product.price).toFixed(2); // Format price
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving product', error });
  }
};

// Update Product by Name
exports.updateProductByName = async (req, res) => {
  try {
    const updates = req.body;

    const [rowsUpdated, [updatedProduct]] = await Product.update(updates, {
      where: { name: req.query.name },
      returning: true, // Return updated product
    });

    if (rowsUpdated === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await logAction('UPDATE', updatedProduct); // Log the update action
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Error updating product', error });
  }
};

// Delete Product by Name
exports.deleteProductByName = async (req, res) => {
  try {
    const product = await Product.findOne({ where: { name: req.query.name } });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await logAction('DELETE', product); // Log the delete action
    await product.destroy(); // Delete the product
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error });
  }
};

// Search products by name
exports.searchProductByName = async (req, res) => {
  try {
    const searchTerm = req.query.name;
    if (!searchTerm) return res.status(400).json({ message: 'No search term provided' });

    const products = await Product.findAll({
      where: { name: { [Op.iLike]: `%${searchTerm}%` } }, // Case-insensitive search
    });

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found matching the search term' });
    }

    res.json(products);
  } catch (error) {
    console.error('Error in search route:', error);
    res.status(500).json({ message: 'Error searching for product', error });
  }
};

// Export products to CSV
exports.exportProductsToCSV = async (req, res) => {
  try {
    const products = await Product.findAll(); // Retrieve all products

    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No products found to export' });
    }

    // Define the fields to include in the CSV
    const fields = ['name', 'price', 'quantity', 'description', 'createdAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(products.map(p => p.dataValues)); // Format for CSV

    // Set headers to prompt download and specify the filename
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="products.csv"');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting products to CSV:', error);
    res.status(500).json({ message: 'Error exporting products', error });
  }
};

// Inventory overview with low stock indicator
exports.getInventoryOverview = async (req, res) => {
  try {
    const products = await Product.findAll({ attributes: ['name', 'quantity'] }); // Retrieve name and quantity only
    const inventoryData = products.map(product => ({
      name: product.name,
      quantity: product.quantity,
      isLowStock: product.quantity < LOW_STOCK_THRESHOLD,
    }));
    res.json(inventoryData);
  } catch (error) {
    console.error('Error retrieving inventory overview:', error);
    res.status(500).json({ message: 'Error retrieving inventory overview', error });
  }
};
