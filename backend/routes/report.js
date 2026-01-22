const express = require('express');
const {
  getLoansIssuedReport,
  getLoanStatusReport,
  getDefaultersReport,
  getDefaultedItemsReport,
  getBalancesReport,
  getNotYetPaidReport,
  getExpensesReport,
  getProfitLossReport,
  getPaidLoansReport
} = require('../controllers/reportController');
const { auth, employeeOrAdmin, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Operational reports for employees
router.get('/loans-issued', auth, employeeOrAdmin, getLoansIssuedReport);
router.get('/loan-status', auth, employeeOrAdmin, getLoanStatusReport);
router.get('/defaulters', auth, employeeOrAdmin, getDefaultersReport);
router.get('/not-yet-paid', auth, employeeOrAdmin, getNotYetPaidReport);
router.get('/paid-loans', auth, employeeOrAdmin, getPaidLoansReport);

// Admin only reports
router.get('/defaulted-items', auth, adminOnly, getDefaultedItemsReport);
router.get('/balances', auth, adminOnly, getBalancesReport);
router.get('/expenses', auth, adminOnly, getExpensesReport);
router.get('/profit-loss', auth, adminOnly, getProfitLossReport);

module.exports = router;