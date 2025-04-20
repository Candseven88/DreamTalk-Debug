// Import required modules
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// Initialize router
const router = express.Router();

// Database file path
const DB_PATH = path.join(__dirname, 'db.json');

/**
 * Read the database file
 * @returns {Promise<Object>} The database content
 */
async function readDatabase() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty object
    return {};
  }
}

/**
 * Get user subscription plan endpoint
 */
router.get('/api/user-plan', async (req, res) => {
  try {
    // Get email from query parameters
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email parameter is required'
      });
    }
    
    // Read database
    const db = await readDatabase();
    
    // Check if user exists in database
    if (db[email]) {
      // Return user plan
      return res.status(200).json({
        userPlan: db[email].userPlan
      });
    } else {
      // User not found, return default free plan
      return res.status(200).json({
        userPlan: 'free'
      });
    }
    
  } catch (error) {
    console.error('Error getting user plan:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;