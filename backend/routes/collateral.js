const express = require('express');
const { createCollateral, getCollaterals, getCollateral, updateCollateral, deleteCollateral, markCollateralAsSold, markCollateralAsNotSold } = require('../controllers/collateralController');
const { auth, employeeOrAdmin, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, employeeOrAdmin, createCollateral);
router.get('/', auth, employeeOrAdmin, getCollaterals);
router.get('/:id', auth, employeeOrAdmin, getCollateral);
router.patch('/:id', auth, employeeOrAdmin, updateCollateral);
router.delete('/:id', auth, adminOnly, deleteCollateral);

// Mark collateral as sold/not sold (admin only)
router.post('/:id/mark-sold', auth, adminOnly, markCollateralAsSold);
router.post('/:id/mark-not-sold', auth, adminOnly, markCollateralAsNotSold);

module.exports = router;