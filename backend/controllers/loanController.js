const Loan = require('../models/Loan');
const Borrower = require('../models/Borrower');
const Collateral = require('../models/Collateral');
const Payment = require('../models/Payment');
const { Op } = require('sequelize');
const { generateLoanAgreementPDF, sendLoanAgreementEmail } = require('../services/loanAgreementService');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');

// STRICT INTEREST STRUCTURE FROM INSTRUCTIONS (Section 2.3)
const STANDARD_INTEREST_RATES = {
  1: 20,  // 1 Week: 20%
  2: 28,  // 2 Weeks: 28%
  3: 32,  // 3 Weeks: 32%
  4: 35   // 4 Weeks (1 Month): 35%
};

// BUSINESS RULES FROM INSTRUCTIONS (Section 2.3)
const MIN_AMOUNT_FOR_4_WEEKS = 12000; // 12k minimum for 1-month loan
const NEGOTIABLE_THRESHOLD = 50000;   // Loans above 50k are negotiable

/**
 * Validate loan business rules according to instructions
 */
const validateLoanRules = (amountIssued, loanPeriod, isNegotiable, userRole) => {
  const errors = [];

  // Validate loan period (must be 1, 2, 3, or 4 weeks)
  if (![1, 2, 3, 4].includes(loanPeriod)) {
    errors.push('Loan period must be 1, 2, 3, or 4 weeks');
  }

  // RULE: 1-Month Qualification - Borrowers must take a loan of 12k or more for 4-week period
  if (loanPeriod === 4 && parseFloat(amountIssued) < MIN_AMOUNT_FOR_4_WEEKS) {
    errors.push(`Amount must be at least ${MIN_AMOUNT_FOR_4_WEEKS.toLocaleString()} KSH for 4-week (1 month) loan period`);
  }

  // RULE: Negotiable Terms - Only loans above 50k can be negotiable, and only by Admin
  if (parseFloat(amountIssued) > NEGOTIABLE_THRESHOLD) {
    if (!isNegotiable && userRole !== 'admin') {
      errors.push(`Loans above ${NEGOTIABLE_THRESHOLD.toLocaleString()} KSH require Admin approval for negotiable terms`);
    }
  } else {
    // Loans under 50k CANNOT be negotiable
    if (isNegotiable) {
      errors.push(`Only loans above ${NEGOTIABLE_THRESHOLD.toLocaleString()} KSH can have negotiable terms`);
    }
  }

  return errors;
};

/**
 * Calculate interest rate based on business rules
 */
const calculateInterestRate = (amountIssued, loanPeriod, isNegotiable, customRate = null) => {
  // If negotiable (loans > 50k), use custom rate set by admin
  if (isNegotiable && customRate !== null) {
    return parseFloat(customRate);
  }

  // Otherwise, use standard interest structure
  return STANDARD_INTEREST_RATES[loanPeriod];
};

/**
 * Create a new loan with strict business rules enforcement
 */
const createLoan = async (req, res) => {
  try {
    const {
      borrowerId,
      collateralId,
      amountIssued,
      loanPeriod,
      interestRate: customInterestRate,
      isNegotiable,
      dateIssued,
      gracePeriodDays = 7
    } = req.body;

    const userRole = req.user.role;

    // Validate business rules
    const validationErrors = validateLoanRules(
      amountIssued,
      loanPeriod,
      isNegotiable,
      userRole
    );

    if (validationErrors.length > 0) {
      return res.status(400).send({
        error: 'Loan validation failed',
        details: validationErrors
      });
    }

    // Verify borrower exists
    const borrower = await Borrower.findByPk(borrowerId);
    if (!borrower) {
      return res.status(404).send({ error: 'Borrower not found' });
    }

    // Verify collateral exists and is not already assigned
    const collateral = await Collateral.findByPk(collateralId);
    if (!collateral) {
      return res.status(404).send({ error: 'Collateral not found' });
    }

    // Check if collateral belongs to this borrower
    if (collateral.borrowerId !== borrowerId) {
      return res.status(400).send({ error: 'Collateral does not belong to this borrower' });
    }

    // Check if collateral is already used in an active loan
    const existingLoan = await Loan.findOne({
      where: {
        collateralId,
        status: { [Op.in]: ['active', 'due', 'pastDue'] }
      }
    });

    if (existingLoan) {
      return res.status(400).send({ error: 'Collateral is already assigned to an active loan' });
    }

    // Calculate interest rate based on rules
    const finalInterestRate = calculateInterestRate(
      amountIssued,
      loanPeriod,
      isNegotiable,
      customInterestRate
    );

    if (!finalInterestRate) {
      return res.status(400).send({ error: 'Invalid interest rate calculation' });
    }

    // Calculate total amount: Principal + Interest
    const interestAmount = parseFloat(amountIssued) * (finalInterestRate / 100);
    const totalAmount = parseFloat(amountIssued) + interestAmount;

    // Calculate due date (loan period is in weeks)
    const issuedDate = dateIssued ? new Date(dateIssued) : new Date();
    const dueDate = new Date(issuedDate);
    dueDate.setDate(dueDate.getDate() + (loanPeriod * 7));

    // Calculate grace period end date
    const gracePeriodEnd = new Date(dueDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

    // Create the loan
    const loan = await Loan.create({
      borrowerId,
      collateralId,
      amountIssued: parseFloat(amountIssued),
      dateIssued: issuedDate,
      loanPeriod,
      interestRate: finalInterestRate,
      dueDate,
      gracePeriodEnd,
      totalAmount,
      isNegotiable: isNegotiable || false,
      status: 'active',
      amountRepaid: 0,
      penalties: 0,
      branchId: req.user.currentBranchId || null
    });

    // Fetch the complete loan with associations
    const completeLoan = await Loan.findByPk(loan.id, {
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Collateral, as: 'collateral' }
      ]
    });

    // Generate and send loan agreement PDF via email
    try {
      console.log(`Generating loan agreement for loan ${loan.id}...`);
      const { filepath, filename } = await generateLoanAgreementPDF(
        completeLoan,
        borrower,
        collateral
      );

      // Send email with loan agreement
      await sendLoanAgreementEmail(completeLoan, borrower, filepath);

      console.log(`Loan agreement generated and emailed successfully for loan ${loan.id}`);
    } catch (agreementError) {
      // Log error but don't fail the loan creation
      console.error('Error generating/sending loan agreement:', agreementError);
    }

    res.status(201).send({
      success: true,
      message: 'Loan created successfully. Loan agreement sent to borrower email.',
      loan: completeLoan,
      calculationDetails: {
        principal: parseFloat(amountIssued),
        interestRate: finalInterestRate,
        interestAmount: interestAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        loanPeriod: `${loanPeriod} week(s)`,
        dueDate: dueDate.toISOString().split('T')[0],
        gracePeriodEnd: gracePeriodEnd.toISOString().split('T')[0]
      }
    });

  } catch (e) {
    console.error('Error creating loan:', e);
    res.status(400).send({ error: e.message });
  }
};

/**
 * Get all loans with filtering
 */
const getLoans = async (req, res) => {
  try {
    const { borrowerId, status, branchId } = req.query;
    const { page, limit, offset } = getPaginationParams(req.query);

    const whereClause = {};

    // Only show loans with approved agreements
    whereClause.agreementStatus = 'approved';

    if (borrowerId) {
      whereClause.borrowerId = borrowerId;
    }

    if (status) {
      whereClause.status = status;
    }

    // Build include array for filtering
    const includeArray = [
      { model: Collateral, as: 'collateral', attributes: ['id', 'itemName', 'category', 'modelNumber', 'serialNumber', 'itemCondition'] }
    ];

    // Filter by employee's assigned location if employee
    // Support multiple locations separated by comma (e.g., "JUJA,HIGHPOINT")
    if (req.user.role === 'employee' && req.user.assignedLocation) {
      const locations = req.user.assignedLocation.split(',').map(loc => loc.trim());
      includeArray.unshift({
        model: Borrower,
        as: 'borrower',
        attributes: ['id', 'fullName', 'phoneNumber', 'email', 'location'],
        where: { location: { [Op.in]: locations } },
        required: true
      });
    } else {
      includeArray.unshift({
        model: Borrower,
        as: 'borrower',
        attributes: ['id', 'fullName', 'phoneNumber', 'email', 'location']
      });
    }

    // Filter by branch if user is not admin (branch-based filtering)
    if (req.user.role !== 'admin' && !req.user.assignedLocation) {
      whereClause.branchId = req.user.currentBranchId;
    } else if (branchId) {
      whereClause.branchId = branchId;
    }

    // Get total count for pagination
    const locations = req.user.role === 'employee' && req.user.assignedLocation
      ? req.user.assignedLocation.split(',').map(loc => loc.trim())
      : [];
    const total = await Loan.count({
      where: whereClause,
      include: req.user.role === 'employee' && req.user.assignedLocation ? [{
        model: Borrower,
        as: 'borrower',
        where: { location: { [Op.in]: locations } },
        attributes: []
      }] : []
    });

    const loans = await Loan.findAll({
      where: whereClause,
      include: includeArray,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.send(formatPaginatedResponse(loans, total, page, limit));
  } catch (e) {
    console.error('Error fetching loans:', e);
    res.status(500).send({ error: e.message });
  }
};

/**
 * Get single loan by ID
 */
const getLoan = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Collateral, as: 'collateral' }
      ]
    });

    if (!loan) {
      return res.status(404).send({ error: 'Loan not found' });
    }

    // Check branch access for non-admin users
    if (req.user.role !== 'admin' && loan.branchId !== req.user.currentBranchId) {
      return res.status(403).send({ error: 'Access denied to this loan' });
    }

    res.send(loan);
  } catch (e) {
    console.error('Error fetching loan:', e);
    res.status(500).send({ error: e.message });
  }
};

/**
 * Update loan - RESTRICTED: Only admin can update loans per instructions
 */
const updateLoan = async (req, res) => {
  try {
    // Per instructions: Employees CANNOT edit loans
    if (req.user.role !== 'admin') {
      return res.status(403).send({
        error: 'Access denied',
        message: 'Only administrators can edit loan details'
      });
    }

    const loan = await Loan.findByPk(req.params.id);
    if (!loan) {
      return res.status(404).send({ error: 'Loan not found' });
    }

    // If updating negotiable loan terms, re-validate
    if (req.body.interestRate || req.body.loanPeriod) {
      if (!loan.isNegotiable) {
        return res.status(400).send({
          error: 'Cannot modify interest rate or period for non-negotiable loans'
        });
      }
    }

    await loan.update(req.body);

    const updatedLoan = await Loan.findByPk(loan.id, {
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Collateral, as: 'collateral' }
      ]
    });

    res.send(updatedLoan);
  } catch (e) {
    console.error('Error updating loan:', e);
    res.status(400).send({ error: e.message });
  }
};

/**
 * Delete loan - RESTRICTED: Only admin can delete per instructions
 */
const deleteLoan = async (req, res) => {
  try {
    // Per instructions: Employees CANNOT delete records
    if (req.user.role !== 'admin') {
      return res.status(403).send({
        error: 'Access denied',
        message: 'Only administrators can delete loans'
      });
    }

    const loan = await Loan.findByPk(req.params.id);
    if (!loan) {
      return res.status(404).send({ error: 'Loan not found' });
    }

    await loan.destroy();
    res.send({ message: 'Loan deleted successfully' });
  } catch (e) {
    console.error('Error deleting loan:', e);
    res.status(500).send({ error: e.message });
  }
};

/**
 * Make payment on a loan
 */
const makePayment = async (req, res) => {
  try {
    const { amount, paymentDate, paymentMethod } = req.body;

    const loan = await Loan.findByPk(req.params.id);
    if (!loan) {
      return res.status(404).send({ error: 'Loan not found' });
    }

    // Create payment record
    await Payment.create({
      loanId: loan.id,
      amount: parseFloat(amount),
      paymentDate: paymentDate || new Date(),
      paymentMethod: paymentMethod || 'cash',
      collectedBy: req.user.id
    });

    // Update loan's amount repaid
    const newAmountRepaid = parseFloat(loan.amountRepaid) + parseFloat(amount);
    const totalDue = parseFloat(loan.totalAmount) + parseFloat(loan.penalties || 0);

    let newStatus = loan.status;
    if (newAmountRepaid >= totalDue) {
      newStatus = 'paid';
    }

    await loan.update({
      amountRepaid: newAmountRepaid,
      lastPaymentDate: paymentDate || new Date(),
      status: newStatus
    });

    const updatedLoan = await Loan.findByPk(loan.id, {
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Collateral, as: 'collateral' }
      ]
    });

    res.send({
      success: true,
      message: 'Payment recorded successfully',
      loan: updatedLoan,
      paymentDetails: {
        amountPaid: parseFloat(amount),
        totalRepaid: newAmountRepaid,
        totalDue: totalDue,
        remainingBalance: Math.max(0, totalDue - newAmountRepaid)
      }
    });

  } catch (e) {
    console.error('Error making payment:', e);
    res.status(400).send({ error: e.message });
  }
};

/**
 * Get standard interest rates (for frontend display)
 */
const getInterestRates = (req, res) => {
  res.send({
    standardRates: STANDARD_INTEREST_RATES,
    rules: {
      minAmountFor4Weeks: MIN_AMOUNT_FOR_4_WEEKS,
      negotiableThreshold: NEGOTIABLE_THRESHOLD
    }
  });
};

module.exports = {
  createLoan,
  getLoans,
  getLoan,
  updateLoan,
  deleteLoan,
  makePayment,
  getInterestRates
};
