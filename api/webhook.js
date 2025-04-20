// Import required modules
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// Initialize Express app
const app = express();
app.use(express.json());

// Import user plan router
const userPlanRouter = require('./user-plan');

// Use the user plan router
app.use(userPlanRouter);

// Database file path
const DB_PATH = path.join(__dirname, 'db.json');

// Product ID to plan mapping
const PRODUCT_PLANS = {
  'prod_4MFFcp902Sp1aXMWsBSuRG': 'starter',
  'prod_m0Fosk4j2ceapiwZkf5Wg': 'plus',
  'prod_4Tezu3Ozv3ETbXMolp2dYr': 'pro'
};

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
 * Write data to the database file
 * @param {Object} data - The data to write
 * @returns {Promise<void>}
 */
async function writeDatabase(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Webhook endpoint to handle subscription notifications
 */
app.post('/api/webhook', async (req, res) => {
  try {
    // Extract data from request body
    const { user_email, product_id, timestamp } = req.body;
    
    // Validate required fields
    if (!user_email || !product_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: user_email or product_id'
      });
    }
    
    // Get plan from product ID
    const plan = PRODUCT_PLANS[product_id];
    if (!plan) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product ID'
      });
    }
    
    // Read current database
    const db = await readDatabase();
    
    // Update user subscription data
    db[user_email] = {
      userPlan: plan,
      subscribedAt: timestamp || Math.floor(Date.now() / 1000)
    };
    
    // Save updated database
    await writeDatabase(db);
    
    // Log the subscription
    console.log(`Subscription updated: ${user_email} -> ${plan}`);
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      user: user_email,
      plan: plan
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Webhook server running on port ${PORT}`);
  });
}

// Export for serverless deployment
module.exports = app;