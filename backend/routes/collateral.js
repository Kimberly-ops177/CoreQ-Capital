const express = require('express');
const { createCollateral, getCollaterals, getCollateral, updateCollateral, deleteCollateral } = require('../controllers/collateralController');
const { auth, employeeOrAdmin, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, employeeOrAdmin, createCollateral);
router.get('/', auth, employeeOrAdmin, getCollaterals);
router.get('/:id', auth, employeeOrAdmin, getCollateral);
router.patch('/:id', auth, employeeOrAdmin, updateCollateral);
router.delete('/:id', auth, adminOnly, deleteCollateral);

module.exports = router;