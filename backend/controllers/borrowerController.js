const Borrower = require('../models/Borrower');
const Loan = require('../models/Loan');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');
const { Op } = require('sequelize');

// Business rules constants
const GRACE_PERIOD_DAYS = 7;
const DAILY_PENALTY_RATE = 3; // 3% per day

/**
 * Compute effective penalties based on current date
 * This ensures penalties are accurate regardless of stored database value
 * Penalty = 3% per day on outstanding amount during grace period (max 7 days = 21%)
 */
const computeEffectivePenalties = (loan) => {
  const now = new Date();
  const dueDate = new Date(loan.dueDate);
  const gracePeriodEnd = new Date(loan.gracePeriodEnd);
  const storedPenalties = parseFloat(loan.penalties || 0);

  // No penalty before due date
  if (now <= dueDate) {
    return storedPenalties;
  }

  // Calculate outstanding amount (principal + interest - repaid)
  const outstandingAmount = parseFloat(loan.totalAmount) - parseFloat(loan.amountRepaid || 0);

  // If already fully paid, no additional penalties needed
  if (outstandingAmount <= 0) {
    return storedPenalties;
  }

  // Calculate days overdue (capped at grace period days for penalty calculation)
  let daysOverdue;
  if (now > gracePeriodEnd) {
    // For defaulted loans, penalties accumulated for full grace period
    daysOverdue = GRACE_PERIOD_DAYS;
  } else {
    // For pastDue loans, calculate actual days overdue
    daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
    daysOverdue = Math.min(daysOverdue, GRACE_PERIOD_DAYS);
  }

  if (daysOverdue <= 0) {
    return storedPenalties;
  }

  // Calculate penalty: 3% per day on outstanding amount
  const dailyPenaltyAmount = outstandingAmount * (DAILY_PENALTY_RATE / 100);
  const calculatedPenalties = dailyPenaltyAmount * daysOverdue;

  // Return the higher of stored or calculated penalties
  return Math.max(storedPenalties, calculatedPenalties);
};

/**
 * Compute effective loan status based on current date
 * This ensures status is always accurate regardless of stored database value
 */
const computeEffectiveStatus = (loan) => {
  const now = new Date();
  const dueDate = new Date(loan.dueDate);
  const gracePeriodEnd = new Date(loan.gracePeriodEnd);
  // Use effective penalties for paid calculation
  const effectivePenalties = computeEffectivePenalties(loan);
  const totalDue = parseFloat(loan.totalAmount) + effectivePenalties;
  const amountRepaid = parseFloat(loan.amountRepaid || 0);

  // If paid in full
  if (amountRepaid >= totalDue) return 'paid';
  // If beyond grace period and not paid
  if (now > gracePeriodEnd) return 'defaulted';
  // If past due date but within grace period
  if (now > dueDate) return 'pastDue';
  // If due today
  if (now.toDateString() === dueDate.toDateString()) return 'due';
  // Otherwise active
  return 'active';
};

const createBorrower = async (req, res) => {
  try {
    const borrower = await Borrower.create(req.body);
    res.status(201).send(borrower);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const getBorrowers = async (req, res) => {
  try {
    const { idNumber, phoneNumber, loanStatus } = req.query;
    const { page, limit, offset } = getPaginationParams(req.query);
    let whereClause = {};

    if (idNumber && phoneNumber) {
      whereClause = { idNumber, phoneNumber };
    }

    // Apply location filter for employees
    // Support multiple locations separated by comma (e.g., "JUJA,HIGHPOINT")
    if (req.user && req.user.role === 'employee' && req.user.assignedLocation) {
      const locations = req.user.assignedLocation.split(',').map(loc => loc.trim());
      console.log('[getBorrowers] Employee filter:', {
        user: req.user.email,
        assignedLocation: req.user.assignedLocation,
        locations,
        whereClause
      });
      whereClause.location = { [Op.in]: locations };
    }

    // Build loan filter - only show borrowers with approved loans
    // Don't filter by stored status - we'll compute effective status dynamically
    const loanWhereClause = { agreementStatus: 'approved' };

    const includeLoans = {
      model: Loan,
      as: 'loans',
      where: loanWhereClause,
      required: true, // Inner join - only borrowers with matching loans
      attributes: ['id', 'status', 'dueDate', 'gracePeriodEnd', 'totalAmount', 'penalties', 'amountRepaid']
    };

    // Fetch all borrowers with their loans first
    const allBorrowers = await Borrower.findAll({
      where: whereClause,
      include: [includeLoans],
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    // Apply effective status to each loan and filter by status if specified
    let filteredBorrowers = allBorrowers.map(borrower => {
      const borrowerData = borrower.toJSON();
      // Compute effective status for each loan
      borrowerData.loans = borrowerData.loans.map(loan => ({
        ...loan,
        status: computeEffectiveStatus(loan)
      }));
      return borrowerData;
    });

    // Filter by loan status if specified (using computed effective status)
    if (loanStatus && loanStatus !== 'all') {
      filteredBorrowers = filteredBorrowers.filter(borrower =>
        borrower.loans.some(loan => loan.status === loanStatus)
      );
      // Also filter the loans array to only include matching status loans
      filteredBorrowers = filteredBorrowers.map(borrower => ({
        ...borrower,
        loans: borrower.loans.filter(loan => loan.status === loanStatus)
      }));
    }

    // Apply pagination manually
    const total = filteredBorrowers.length;
    const paginatedBorrowers = filteredBorrowers.slice(offset, offset + limit);

    res.send(formatPaginatedResponse(paginatedBorrowers, total, page, limit));
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

const getBorrower = async (req, res) => {
  try {
    const borrower = await Borrower.findByPk(req.params.id);
    if (!borrower) {
      return res.status(404).send({ error: 'Borrower not found' });
    }
    res.send(borrower);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

const updateBorrower = async (req, res) => {
  try {
    // Check location permission for employees
    if (req.user && req.user.role === 'employee' && req.user.assignedLocation) {
      const borrower = await Borrower.findByPk(req.params.id);
      if (borrower) {
        const allowedLocations = req.user.assignedLocation.split(',').map(loc => loc.trim());
        if (!allowedLocations.includes(borrower.location)) {
          return res.status(403).send({ error: 'You can only edit borrowers from your assigned locations' });
        }
      }
    }

    const [updatedRowsCount] = await Borrower.update(req.body, {
      where: { id: req.params.id }
    });
    if (updatedRowsCount === 0) {
      return res.status(404).send({ error: 'Borrower not found' });
    }
    const borrower = await Borrower.findByPk(req.params.id);
    res.send(borrower);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const deleteBorrower = async (req, res) => {
  try {
    const deletedRowsCount = await Borrower.destroy({
      where: { id: req.params.id }
    });
    if (deletedRowsCount === 0) {
      return res.status(404).send({ error: 'Borrower not found' });
    }
    res.send({ message: 'Borrower deleted' });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

module.exports = { createBorrower, getBorrowers, getBorrower, updateBorrower, deleteBorrower };