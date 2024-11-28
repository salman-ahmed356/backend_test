const express = require('express');
const { Log } = require('../models/Log'); // Import Sequelize Log model
const authMiddleware = require('../middleware/auth'); // Authentication middleware

const router = express.Router();

// Get all logs with optional product name filter
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.query;

    // Filter logs by product name if provided
    const logs = await Log.findAll({
      where: name ? { productName: { [Op.iLike]: `%${name}%` } } : undefined, // Case-insensitive filter
      order: [['createdAt', 'DESC']], // Order by newest first
    });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete all logs
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await Log.destroy({ where: {} }); // Delete all log entries
    res.status(200).json({ message: 'All logs cleared successfully' });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a specific log by ID
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const logId = req.params.id;

    // Delete a specific log by its ID
    const deletedLog = await Log.destroy({ where: { id: logId } });
    if (!deletedLog) return res.status(404).json({ message: 'Log not found' });

    res.status(200).json({ message: 'Log deleted successfully' });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
