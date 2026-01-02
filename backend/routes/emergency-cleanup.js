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

// Correct interest rates
const STANDARD_RATES = {
  1: 20,   // 1 Week: 20%
  2: 28,   // 2 Weeks: 28%
  3: 32,   // 3 Weeks: 32%
  4: 35    // 4 Weeks: 35%
};

// Fix all non-negotiable loans to use correct interest rates
router.post('/fix-loan-rates', adminOnly, async (req, res) => {
  const db = req.app.get('db');

  try {
    console.log('🔄 Fixing loan interest rates...');

    // Get all non-negotiable loans
    const [loans] = await db.query(`
      SELECT id, amountIssued, loanPeriod, interestRate, totalAmount, isNegotiable
      FROM loans
      WHERE isNegotiable = FALSE OR isNegotiable IS NULL
    `);

    const updates = [];

    for (const loan of loans) {
      const correctRate = STANDARD_RATES[loan.loanPeriod];
      const currentRate = parseFloat(loan.interestRate);
      const principal = parseFloat(loan.amountIssued);

      if (correctRate && Math.abs(currentRate - correctRate) > 0.01) {
        // Rate is incorrect, calculate correct values
        const interestAmount = principal * (correctRate / 100);
        const correctTotal = principal + interestAmount;

        await db.query(
          'UPDATE loans SET interestRate = ?, totalAmount = ? WHERE id = ?',
          [correctRate, correctTotal, loan.id]
        );

        updates.push({
          loanId: loan.id,
          period: loan.loanPeriod,
          principal: principal,
          oldRate: currentRate,
          newRate: correctRate,
          oldTotal: parseFloat(loan.totalAmount),
          newTotal: correctTotal
        });
      }
    }

    console.log(`✓ Fixed ${updates.length} loan(s)`);

    res.send({
      success: true,
      message: `Fixed ${updates.length} loan(s) with incorrect interest rates`,
      updates
    });
  } catch (error) {
    console.error('Fix loan rates error:', error);
    res.status(500).send({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
