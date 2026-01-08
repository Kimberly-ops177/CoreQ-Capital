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

/**
 * Mark collateral as sold (Admin only)
 * Updates isSold status, soldPrice, and soldDate
 */
const markCollateralAsSold = async (req, res) => {
  try {
    const { id } = req.params;
    const { soldPrice, soldDate } = req.body;

    // Validate sold price
    if (!soldPrice || parseFloat(soldPrice) <= 0) {
      return res.status(400).send({
        error: 'Invalid sold price',
        message: 'Sold price must be a positive number'
      });
    }

    const collateral = await Collateral.findByPk(id, {
      include: [{ model: Borrower, as: 'borrower' }]
    });

    if (!collateral) {
      return res.status(404).send({ error: 'Collateral not found' });
    }

    // Check if collateral is seized (defaulted)
    if (!collateral.isSeized) {
      return res.status(400).send({
        error: 'Collateral not defaulted',
        message: 'Only seized/defaulted collateral can be marked as sold'
      });
    }

    // Check if already sold
    if (collateral.isSold) {
      return res.status(400).send({
        error: 'Already sold',
        message: 'This collateral has already been marked as sold'
      });
    }

    // Update collateral as sold
    await collateral.update({
      isSold: true,
      soldPrice: parseFloat(soldPrice),
      soldDate: soldDate || new Date(),
      status: 'sold'
    });

    // Reload to get updated data
    await collateral.reload();

    res.send({
      success: true,
      message: 'Collateral marked as sold successfully',
      collateral
    });
  } catch (e) {
    console.error('Error marking collateral as sold:', e);
    res.status(500).send({ error: e.message });
  }
};

/**
 * Mark collateral as not sold (Admin only)
 * Reverts the sold status back to seized
 */
const markCollateralAsNotSold = async (req, res) => {
  try {
    const { id } = req.params;

    const collateral = await Collateral.findByPk(id, {
      include: [{ model: Borrower, as: 'borrower' }]
    });

    if (!collateral) {
      return res.status(404).send({ error: 'Collateral not found' });
    }

    // Check if collateral is sold
    if (!collateral.isSold) {
      return res.status(400).send({
        error: 'Not sold',
        message: 'This collateral is not marked as sold'
      });
    }

    // Revert sold status
    await collateral.update({
      isSold: false,
      soldPrice: null,
      soldDate: null,
      status: 'seized'
    });

    // Reload to get updated data
    await collateral.reload();

    res.send({
      success: true,
      message: 'Collateral marked as not sold',
      collateral
    });
  } catch (e) {
    console.error('Error marking collateral as not sold:', e);
    res.status(500).send({ error: e.message });
  }
};

module.exports = {
  createCollateral,
  getCollaterals,
  getCollateral,
  updateCollateral,
  deleteCollateral,
  markCollateralAsSold,
  markCollateralAsNotSold
};
