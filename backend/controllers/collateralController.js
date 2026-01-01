const Collateral = require('../models/Collateral');
const Borrower = require('../models/Borrower');
const Loan = require('../models/Loan');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');
const { Op } = require('sequelize');

const createCollateral = async (req, res) => {
  try {
    const collateral = await Collateral.create(req.body);
    res.status(201).send(collateral);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const getCollaterals = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);

    // Build include array
    const includeArray = [];

    // Include borrower with location filter for employees
    const borrowerInclude = {
      model: Borrower,
      as: 'borrower',
      attributes: ['id', 'fullName', 'phoneNumber', 'idNumber', 'location']
    };

    // Filter by employee's assigned location
    // Support multiple locations separated by comma (e.g., "JUJA,HIGHPOINT")
    if (req.user && req.user.role === 'employee' && req.user.assignedLocation) {
      const locations = req.user.assignedLocation.split(',').map(loc => loc.trim());
      borrowerInclude.where = { location: { [Op.in]: locations } };
      borrowerInclude.required = true;
    }

    includeArray.push(borrowerInclude);

    // Only show collaterals with at least one approved loan
    includeArray.push({
      model: Loan,
      as: 'loans',
      where: { agreementStatus: 'approved' },
      required: true, // Inner join - only collaterals with approved loans
      attributes: [] // Don't return loan data, just filter
    });

    // Get total count for pagination (with all filters)
    const total = await Collateral.count({
      include: includeArray,
      distinct: true
    });

    const collaterals = await Collateral.findAll({
      include: includeArray,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    res.send(formatPaginatedResponse(collaterals, total, page, limit));
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

const getCollateral = async (req, res) => {
  try {
    const collateral = await Collateral.findByPk(req.params.id, {
      include: [{
        model: Borrower,
        as: 'borrower'
      }]
    });
    if (!collateral) {
      return res.status(404).send({ error: 'Collateral not found' });
    }
    res.send(collateral);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

const updateCollateral = async (req, res) => {
  try {
    const collateral = await Collateral.findByPk(req.params.id);
    if (!collateral) {
      return res.status(404).send({ error: 'Collateral not found' });
    }
    await collateral.update(req.body);
    res.send(collateral);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const deleteCollateral = async (req, res) => {
  try {
    const collateral = await Collateral.findByPk(req.params.id);
    if (!collateral) {
      return res.status(404).send({ error: 'Collateral not found' });
    }
    await collateral.destroy();
    res.send({ message: 'Collateral deleted' });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

module.exports = { createCollateral, getCollaterals, getCollateral, updateCollateral, deleteCollateral };
