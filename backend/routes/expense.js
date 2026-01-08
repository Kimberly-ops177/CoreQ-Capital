const express = require('express');
const { getExpenseCategories, createExpense, getExpenses, getExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

const canAddExpense = (req, res, next) => {
  if (req.user.role === 'admin' || (req.user.role === 'employee' && req.user.permissions.canAddExpense)) {
    next();
  } else {
    res.status(403).send({ error: 'Access denied.' });
  }
};

// Get expense categories (available to all authenticated users)
router.get('/categories', auth, getExpenseCategories);

router.post('/', auth, canAddExpense, createExpense);
router.get('/', auth, adminOnly, getExpenses);
router.get('/:id', auth, adminOnly, getExpense);
router.patch('/:id', auth, adminOnly, updateExpense);
router.delete('/:id', auth, adminOnly, deleteExpense);

module.exports = router;