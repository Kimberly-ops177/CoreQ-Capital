const express = require('express');
const { getPnL, getAdminDashboardData, getEmployeeDashboardData } = require('../controllers/financialController');
const { auth, adminOnly, employeeOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/pnl', auth, adminOnly, getPnL);
router.get('/dashboard/admin', auth, adminOnly, getAdminDashboardData);
router.get('/dashboard/employee', auth, employeeOrAdmin, getEmployeeDashboardData);

module.exports = router;