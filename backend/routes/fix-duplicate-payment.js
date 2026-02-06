const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const sequelize = require('../config/database');

const router = express.Router();

/**
 * ADMIN ONLY: Fix duplicate payment for Loan ID 11
 * POST /api/fix-duplicate-payment/loan-11
 */
router.post('/loan-11', auth, adminOnly, async (req, res) => {
  try {
    console.log('🔧 Admin initiated fix for duplicate payment - Loan ID 11');
    console.log(`Requested by: ${req.user.name} (ID: ${req.user.id})`);

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Get loan details before fix
      const [loanBefore] = await sequelize.query(
        'SELECT id, amountRepaid, totalAmount FROM loans WHERE id = 11',
        { type: sequelize.QueryTypes.SELECT, transaction }
      );

      if (!loanBefore) {
        await transaction.rollback();
        return res.status(404).send({
          error: 'Loan ID 11 not found',
          message: 'The loan may have already been fixed or does not exist.'
        });
      }

      // Get all payment records for this loan
      const payments = await sequelize.query(
        'SELECT * FROM payments WHERE loanId = 11 ORDER BY id ASC',
        { type: sequelize.QueryTypes.SELECT, transaction }
      );

      if (payments.length !== 2) {
        await transaction.rollback();
        return res.status(400).send({
          error: 'Unexpected payment count',
          message: `Expected 2 payment records, found ${payments.length}. The issue may have already been fixed.`,
          currentAmountRepaid: loanBefore.amountRepaid
        });
      }

      const payment1 = payments[0];
      const payment2 = payments[1];

      // Verify both payments are 5760.00
      if (Math.abs(parseFloat(payment1.amount) - 5760) > 0.01 ||
          Math.abs(parseFloat(payment2.amount) - 5760) > 0.01) {
        await transaction.rollback();
        return res.status(400).send({
          error: 'Payment amounts do not match expected values',
          message: 'Payments do not match the expected duplicate of 5760.00. Aborting to prevent unintended changes.',
          payment1Amount: payment1.amount,
          payment2Amount: payment2.amount
        });
      }

      // Delete the second duplicate payment
      await sequelize.query(
        'DELETE FROM payments WHERE id = ?',
        { replacements: [payment2.id], transaction }
      );

      // Update loan's amountRepaid
      const newAmountRepaid = parseFloat(payment1.amount);
      await sequelize.query(
        'UPDATE loans SET amountRepaid = ? WHERE id = 11',
        { replacements: [newAmountRepaid], transaction }
      );

      // Commit the transaction
      await transaction.commit();

      // Verify the fix
      const [updatedLoan] = await sequelize.query(
        'SELECT id, amountRepaid FROM loans WHERE id = 11',
        { type: sequelize.QueryTypes.SELECT }
      );

      const remainingPayments = await sequelize.query(
        'SELECT * FROM payments WHERE loanId = 11',
        { type: sequelize.QueryTypes.SELECT }
      );

      console.log('✅ Duplicate payment fix completed successfully');
      console.log(`   Before: KSH ${parseFloat(loanBefore.amountRepaid).toLocaleString()}`);
      console.log(`   After: KSH ${parseFloat(updatedLoan.amountRepaid).toLocaleString()}`);

      res.send({
        success: true,
        message: 'Duplicate payment fixed successfully',
        details: {
          before: {
            amountRepaid: parseFloat(loanBefore.amountRepaid),
            paymentCount: 2
          },
          after: {
            amountRepaid: parseFloat(updatedLoan.amountRepaid),
            paymentCount: remainingPayments.length
          },
          changes: {
            deletedPaymentId: payment2.id,
            deletedPaymentAmount: parseFloat(payment2.amount),
            amountCorrected: parseFloat(loanBefore.amountRepaid) - parseFloat(updatedLoan.amountRepaid)
          }
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fixing duplicate payment:', error);
    res.status(500).send({
      error: 'Failed to fix duplicate payment',
      message: error.message
    });
  }
});

/**
 * ADMIN ONLY: Check status of Loan ID 11
 * GET /api/fix-duplicate-payment/check-loan-11
 */
router.get('/check-loan-11', auth, adminOnly, async (req, res) => {
  try {
    // Get loan details
    const [loan] = await sequelize.query(
      'SELECT id, amountRepaid, totalAmount, status FROM loans WHERE id = 11',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (!loan) {
      return res.status(404).send({
        error: 'Loan ID 11 not found'
      });
    }

    // Get payment records
    const payments = await sequelize.query(
      'SELECT * FROM payments WHERE loanId = 11 ORDER BY id ASC',
      { type: sequelize.QueryTypes.SELECT }
    );

    const totalPayments = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    res.send({
      loan: {
        id: loan.id,
        amountRepaid: parseFloat(loan.amountRepaid),
        totalAmount: parseFloat(loan.totalAmount),
        status: loan.status
      },
      payments: payments.map(p => ({
        id: p.id,
        amount: parseFloat(p.amount),
        paymentDate: p.paymentDate,
        createdAt: p.createdAt
      })),
      summary: {
        paymentCount: payments.length,
        totalPayments: totalPayments,
        loanAmountRepaid: parseFloat(loan.amountRepaid),
        match: Math.abs(totalPayments - parseFloat(loan.amountRepaid)) < 0.01,
        hasDuplicate: payments.length > 1 && payments.length === 2 &&
                      Math.abs(parseFloat(payments[0].amount) - parseFloat(payments[1].amount)) < 0.01
      }
    });

  } catch (error) {
    console.error('Error checking loan status:', error);
    res.status(500).send({
      error: 'Failed to check loan status',
      message: error.message
    });
  }
});

module.exports = router;
