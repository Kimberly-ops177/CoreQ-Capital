const Borrower = require('../models/Borrower');
const Loan = require('../models/Loan');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');
const { Op } = require('sequelize');

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
    const { idNumber, phoneNumber } = req.query;
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

    // Only show borrowers with at least one approved loan
    const includeLoans = {
      model: Loan,
      as: 'loans',
      where: { agreementStatus: 'approved' },
      required: true, // Inner join - only borrowers with approved loans
      attributes: [] // Don't return loan data, just filter
    };

    // Get total count for pagination (with the approved loan filter)
    const total = await Borrower.count({
      where: whereClause,
      include: [includeLoans],
      distinct: true
    });

    const borrowers = await Borrower.findAll({
      where: whereClause,
      include: [includeLoans],
      order: [['createdAt', 'DESC']], // Most recent first
      limit,
      offset,
      distinct: true
    });

    res.send(formatPaginatedResponse(borrowers, total, page, limit));
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