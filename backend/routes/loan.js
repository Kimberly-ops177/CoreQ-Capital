const express = require('express');
const { createLoan, getLoans, getLoan, updateLoan, deleteLoan, makePayment, closeLoan, getInterestRates, updateInterestRate } = require('../controllers/loanController');
const { auth, employeeOrAdmin, adminOnly } = require('../middleware/auth');
const { processAllLoans, processSingleLoan } = require('../services/loanStatusService');

const router = express.Router();

// Get interest rates and business rules (public for form display)
router.get('/interest-rates', auth, getInterestRates);

// Loan CRUD operations
router.post('/', auth, employeeOrAdmin, createLoan);
router.get('/', auth, employeeOrAdmin, getLoans);
router.get('/:id', auth, employeeOrAdmin, getLoan);
router.patch('/:id', auth, adminOnly, updateLoan);
router.delete('/:id', auth, adminOnly, deleteLoan);

// Update interest rate (admin only, loans above 50k)
router.patch('/:id/interest-rate', auth, adminOnly, updateInterestRate);

// Payment
router.post('/:id/payment', auth, employeeOrAdmin, makePayment);

// Close loan (admin only)
router.post('/:id/close', auth, adminOnly, closeLoan);

// Refresh all loan statuses (admin only) - updates status based on due dates
router.post('/refresh-statuses', auth, adminOnly, async (req, res) => {
  try {
    const results = await processAllLoans();
    res.json({
      success: true,
      message: 'Loan statuses refreshed successfully',
      results
    });
  } catch (error) {
    console.error('Error refreshing loan statuses:', error);
    res.status(500).json({ error: 'Failed to refresh loan statuses' });
  }
});

// Refresh single loan status
router.post('/:id/refresh-status', auth, employeeOrAdmin, async (req, res) => {
  try {
    const loan = await processSingleLoan(req.params.id);
    res.json({
      success: true,
      message: 'Loan status refreshed',
      loan
    });
  } catch (error) {
    console.error('Error refreshing loan status:', error);
    res.status(500).json({ error: error.message || 'Failed to refresh loan status' });
  }
});

module.exports = router;