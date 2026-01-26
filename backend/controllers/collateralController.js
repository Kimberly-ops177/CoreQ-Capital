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
    const { borrowerIdNumber, loanStatus } = req.query;

    // Build where clause - exclude returned collaterals (loan was paid, collateral returned to borrower)
    const whereClause = {
      status: { [Op.ne]: 'returned' }
    };

    // Build include array
    const includeArray = [];

    // Include borrower with location filter for employees
    const borrowerInclude = {
      model: Borrower,
      as: 'borrower',
      attributes: ['id', 'fullName', 'phoneNumber', 'idNumber', 'location']
    };

    // Filter by borrower ID number if provided
    if (borrowerIdNumber) {
      borrowerInclude.where = {
        ...(borrowerInclude.where || {}),
        idNumber: { [Op.like]: `%${borrowerIdNumber}%` }
      };
      borrowerInclude.required = true;
    }

    // Filter by employee's assigned location
    // Support multiple locations separated by comma (e.g., "JUJA,HIGHPOINT")
    if (req.user && req.user.role === 'employee' && req.user.assignedLocation) {
      const locations = req.user.assignedLocation.split(',').map(loc => loc.trim());
      borrowerInclude.where = {
        ...(borrowerInclude.where || {}),
        location: { [Op.in]: locations }
      };
      borrowerInclude.required = true;
    }

    includeArray.push(borrowerInclude);

    // Only show collaterals with at least one approved loan - include loan data with all needed fields
    includeArray.push({
      model: Loan,
      as: 'loans',
      where: { agreementStatus: 'approved' },
      required: true, // Inner join - only collaterals with approved loans
      attributes: ['id', 'amountIssued', 'totalAmount', 'status', 'dueDate', 'gracePeriodEnd', 'amountRepaid', 'penalties'] // Include all fields needed for status computation
    });

    // Get total count for pagination (with all filters)
    const total = await Collateral.count({
      where: whereClause,
      include: includeArray,
      distinct: true
    });

    const collaterals = await Collateral.findAll({
      where: whereClause,
      include: includeArray,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    // Compute dynamic loan status for each collateral
    const collateralsWithStatus = collaterals.map(collateral => {
      const collateralJSON = collateral.toJSON();

      // Compute status for all associated loans
      if (collateralJSON.loans && collateralJSON.loans.length > 0) {
        collateralJSON.loans = collateralJSON.loans.map(loan => {
          const effectiveStatus = computeEffectiveStatus(loan);

          // Calculate days overdue for pastDue status
          let daysOverdue = 0;
          if (effectiveStatus === 'pastDue') {
            const now = new Date();
            const dueDate = new Date(loan.dueDate);
            daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
          }

          return {
            ...loan,
            effectiveStatus,
            daysOverdue
          };
        });

        // Set the primary loan status (use first loan's status)
        collateralJSON.loanStatus = collateralJSON.loans[0].effectiveStatus;
        collateralJSON.daysOverdue = collateralJSON.loans[0].daysOverdue;
      } else {
        collateralJSON.loanStatus = 'unknown';
        collateralJSON.daysOverdue = 0;
      }

      return collateralJSON;
    });

    // Filter by loan status if provided
    let filteredCollaterals = collateralsWithStatus;
    if (loanStatus && loanStatus !== 'all') {
      if (loanStatus === 'sold') {
        // Filter sold items
        filteredCollaterals = collateralsWithStatus.filter(c => c.isSold === true);
      } else {
        // Filter by loan status (active, pastDue, defaulted, paid)
        filteredCollaterals = collateralsWithStatus.filter(c => c.loanStatus === loanStatus);
      }
    }

    res.send(formatPaginatedResponse(filteredCollaterals, filteredCollaterals.length, page, limit));
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
 * Dynamic status computation helper
 */
const computeEffectiveStatus = (loan) => {
  const now = new Date();
  const dueDate = new Date(loan.dueDate);
  const gracePeriodEnd = new Date(loan.gracePeriodEnd);

  const totalDue = parseFloat(loan.totalAmount) + parseFloat(loan.penalties || 0);
  const amountRepaid = parseFloat(loan.amountRepaid || 0);

  if (amountRepaid >= totalDue) return 'paid';
  if (now > gracePeriodEnd) return 'defaulted';
  if (now > dueDate) return 'pastDue';
  if (now.toDateString() === dueDate.toDateString()) return 'due';
  return 'active';
};

/**
 * Mark collateral as sold (Admin only)
 * Updates isSold status, soldPrice, and soldDate
 * Hybrid approach: Allow if EITHER manually seized OR loan is dynamically defaulted
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
      include: [
        { model: Borrower, as: 'borrower' },
        {
          model: Loan,
          as: 'loans',
          attributes: ['id', 'dueDate', 'gracePeriodEnd', 'totalAmount', 'amountRepaid', 'penalties']
        }
      ]
    });

    if (!collateral) {
      return res.status(404).send({ error: 'Collateral not found' });
    }

    // Check if already sold
    if (collateral.isSold) {
      return res.status(400).send({
        error: 'Already sold',
        message: 'This collateral has already been marked as sold'
      });
    }

    // Hybrid validation: Allow if EITHER seized OR loan is dynamically defaulted
    let isAllowedToSell = collateral.isSeized; // Check manual seizing first

    if (!isAllowedToSell && collateral.loans && collateral.loans.length > 0) {
      // Check if any associated loan is dynamically defaulted
      for (const loan of collateral.loans) {
        const effectiveStatus = computeEffectiveStatus(loan);
        if (effectiveStatus === 'defaulted') {
          isAllowedToSell = true;
          // Auto-seize if not already seized
          if (!collateral.isSeized) {
            await collateral.update({ isSeized: true });
          }
          break;
        }
      }
    }

    if (!isAllowedToSell) {
      return res.status(400).send({
        error: 'Collateral not defaulted',
        message: 'Only seized/defaulted collateral can be marked as sold'
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
