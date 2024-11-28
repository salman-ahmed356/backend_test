const { Log } = require('../models/Log'); // Import Sequelize Log model
const { Product } = require('../models/Product'); // Import Sequelize Product model

// Get logs with optional name filter
exports.getLogs = async (req, res) => {
  try {
    const { name } = req.query;

    // Filter logs by product name if provided
    const logs = await Log.findAll({
      where: name ? { productName: { [Op.iLike]: `%${name}%` } } : undefined, // Case-insensitive search
    });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Error fetching logs' });
  }
};

// Undo delete action by restoring the product
exports.undoDelete = async (req, res) => {
  try {
    // Find the log entry for the deleted product
    const logEntry = await Log.findByPk(req.params.id);

    if (!logEntry || logEntry.action !== 'DELETE') {
      return res.status(404).json({ message: 'Log entry not found or not a delete action' });
    }

    // Ensure price is defined before restoring
    if (logEntry.price === undefined || logEntry.price === null) {
      return res.status(400).json({ message: 'Price information is missing in the log entry' });
    }

    // Restore the product using data from the log entry
    const restoredProduct = await Product.create({
      name: logEntry.productName,
      price: logEntry.price,
      quantity: logEntry.quantity,
      description: logEntry.description,
    });

    res.status(200).json({ message: 'Product restored successfully', restoredProduct });
  } catch (error) {
    console.error('Error restoring product:', error);
    res.status(500).json({ message: 'Failed to restore product', error });
  }
};

// Clear all logs
exports.clearAllLogs = async (req, res) => {
  try {
    await Log.destroy({ where: {} }); // Delete all rows in the Logs table
    res.status(200).json({ message: 'All logs cleared successfully' });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({ message: 'Failed to clear logs' });
  }
};

// Delete a specific log by ID
exports.deleteLog = async (req, res) => {
  try {
    const logId = req.params.id;
    const deletedLog = await Log.destroy({ where: { id: logId } }); // Delete log by ID

    if (deletedLog) {
      res.status(200).json({ message: 'Log deleted successfully' });
    } else {
      res.status(404).json({ message: 'Log not found' });
    }
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ message: 'Failed to delete log' });
  }
};
