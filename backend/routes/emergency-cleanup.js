const express = require('express');
const router = express.Router();
const { adminOnly } = require('../middleware/auth');

// Emergency cleanup endpoint - admin only
router.post('/cleanup-database', adminOnly, async (req, res) => {
  const db = req.app.get('db');

  try {
    console.log('🔄 Starting emergency database cleanup...');

    // Delete in correct order to respect foreign key constraints
    await db.query('DELETE FROM payments');
    await db.query('DELETE FROM loans');
    await db.query('DELETE FROM collaterals');
    await db.query('DELETE FROM borrowers');
    await db.query('DELETE FROM expenses');
    await db.query("DELETE FROM users WHERE role != 'admin' AND email != 'admin@coreqcapital.com'");
    await db.query('DELETE FROM branch_capital');
    await db.query('DELETE FROM user_branch_access');
    await db.query('DELETE FROM branches');
    await db.query('DELETE FROM custom_fields');

    console.log('✓ Database cleanup completed successfully');

    res.send({
      success: true,
      message: 'All test data has been removed successfully',
      note: 'Database is now ready for real clients'
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).send({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
