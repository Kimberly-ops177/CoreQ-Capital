const express = require('express');
const { createBorrower, getBorrowers, getBorrower, updateBorrower, deleteBorrower } = require('../controllers/borrowerController');
const { auth, employeeOrAdmin, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, employeeOrAdmin, createBorrower);
router.get('/', auth, employeeOrAdmin, getBorrowers);
router.get('/:id', auth, employeeOrAdmin, getBorrower);
router.patch('/:id', auth, employeeOrAdmin, updateBorrower);
router.delete('/:id', auth, adminOnly, deleteBorrower);

module.exports = router;