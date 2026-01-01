const Expense = require('../models/Expense');
const User = require('../models/User');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');

/**
 * SECTION 3.1 - EXPENSE & PROFITABILITY MODULE
 * Required Fields: Category, Name (description), Date, and Amount
 */

/**
 * Create a new expense
 * Required fields per instructions: category, name, date, amount
 */
const createExpense = async (req, res) => {
  try {
    const { category, name, date, amount } = req.body;

    // Validate required fields
    if (!category || !name || !amount) {
      return res.status(400).send({
        error: 'Missing required fields',
        required: ['category', 'name', 'amount']
      });
    }

    const expense = await Expense.create({
      category,
      name,
      date: date || new Date(),
      amount: parseFloat(amount),
      addedBy: req.user.id,
      branchId: req.user.currentBranchId || null
    });

    res.status(201).send(expense);
  } catch (e) {
    console.error('Error creating expense:', e);
    res.status(400).send({ error: e.message });
  }
};

/**
 * Get all expenses
 * Filter by branch for non-admin users
 */
const getExpenses = async (req, res) => {
  try {
    const { branchId } = req.query;
    const { page, limit, offset } = getPaginationParams(req.query);
    const whereClause = {};

    // Filter by branch if user is not admin
    if (req.user.role !== 'admin') {
      whereClause.branchId = req.user.currentBranchId;
    } else if (branchId) {
      whereClause.branchId = branchId;
    }

    // Get total count for pagination
    const total = await Expense.count({ where: whereClause });

    const expenses = await Expense.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      order: [['date', 'DESC']],
      limit,
      offset
    });

    res.send(formatPaginatedResponse(expenses, total, page, limit));
  } catch (e) {
    console.error('Error fetching expenses:', e);
    res.status(500).send({ error: e.message });
  }
};

/**
 * Get single expense by ID
 */
const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).send({ error: 'Expense not found' });
    }

    // Check branch access for non-admin users
    if (req.user.role !== 'admin' && expense.branchId !== req.user.currentBranchId) {
      return res.status(403).send({ error: 'Access denied to this expense' });
    }

    res.send(expense);
  } catch (e) {
    console.error('Error fetching expense:', e);
    res.status(500).send({ error: e.message });
  }
};

/**
 * Update expense
 * Only admin can update expenses
 */
const updateExpense = async (req, res) => {
  try {
    // Per instructions: Only administrators can edit/delete
    if (req.user.role !== 'admin') {
      return res.status(403).send({
        error: 'Access denied',
        message: 'Only administrators can edit expenses'
      });
    }

    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).send({ error: 'Expense not found' });
    }

    await expense.update(req.body);

    const updatedExpense = await Expense.findByPk(expense.id);
    res.send(updatedExpense);
  } catch (e) {
    console.error('Error updating expense:', e);
    res.status(400).send({ error: e.message });
  }
};

/**
 * Delete expense
 * Only admin can delete expenses
 */
const deleteExpense = async (req, res) => {
  try {
    // Per instructions: Only administrators can delete
    if (req.user.role !== 'admin') {
      return res.status(403).send({
        error: 'Access denied',
        message: 'Only administrators can delete expenses'
      });
    }

    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).send({ error: 'Expense not found' });
    }

    await expense.destroy();
    res.send({ message: 'Expense deleted successfully' });
  } catch (e) {
    console.error('Error deleting expense:', e);
    res.status(500).send({ error: e.message });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense
};
