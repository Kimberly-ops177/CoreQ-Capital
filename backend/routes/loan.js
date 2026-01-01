const express = require('express');
const { createLoan, getLoans, getLoan, updateLoan, deleteLoan, makePayment, getInterestRates } = require('../controllers/loanController');
const { auth, employeeOrAdmin, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get interest rates and business rules (public for form display)
router.get('/interest-rates', auth, getInterestRates);

// Loan CRUD operations
router.post('/', auth, employeeOrAdmin, createLoan);
router.get('/', auth, employeeOrAdmin, getLoans);
router.get('/:id', auth, employeeOrAdmin, getLoan);
router.patch('/:id', auth, adminOnly, updateLoan);
router.delete('/:id', auth, adminOnly, deleteLoan);

// Payment
router.post('/:id/payment', auth, employeeOrAdmin, makePayment);

module.exports = router;