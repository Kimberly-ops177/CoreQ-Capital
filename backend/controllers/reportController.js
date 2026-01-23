const Loan = require('../models/Loan');
const Borrower = require('../models/Borrower');
const Collateral = require('../models/Collateral');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * SECTION 3.2 - REPORTING MODULE
 * Strict implementation of all 8 required reports from instructions
 */

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

/**
 * 1. Loans Issued Report
 * List of all loans, filterable by time period (daily, weekly, monthly, etc.)
 */
const getLoansIssuedReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = {};

    // Filter by date range if provided
    if (startDate && endDate) {
      whereClause.dateIssued = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.dateIssued = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.dateIssued = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Build include with location filter for employees
    const includeOptions = [
      { model: Collateral, as: 'collateral' }
    ];

    // Filter by assigned location for employees
    // Support multiple locations separated by comma (e.g., "JUJA,HIGHPOINT")
    if (req.user.role === 'employee' && req.user.assignedLocation) {
      const locations = req.user.assignedLocation.split(',').map(loc => loc.trim());
      includeOptions.unshift({
        model: Borrower,
        as: 'borrower',
        where: { location: { [Op.in]: locations } },
        required: true
      });
    } else {
      includeOptions.unshift({
        model: Borrower,
        as: 'borrower'
      });
    }

    const loans = await Loan.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['dateIssued', 'DESC']]
    });

    res.send({
      report: 'Loans Issued Report',
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
      totalLoans: loans.length,
      totalAmountIssued: loans.reduce((sum, loan) => sum + parseFloat(loan.amountIssued), 0),
      loans
    });
  } catch (e) {
    console.error('Error generating Loans Issued Report:', e);
    res.status(500).send({ error: e.message });
  }
};

/**
 * 2. Loan Status Report
 * Comprehensive overview categorized by status (Active, Due, Past Due, Paid in Full, Defaulted)
 */
const getLoanStatusReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = {};

    // Filter by date range if provided
    if (startDate && endDate) {
      whereClause.dateIssued = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.dateIssued = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.dateIssued = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Build include with location filter for employees
    const includeOptions = [
      { model: Collateral, as: 'collateral' }
    ];

    // Filter by assigned location for employees
    // Support multiple locations separated by comma (e.g., "JUJA,HIGHPOINT")
    if (req.user.role === 'employee' && req.user.assignedLocation) {
      const locations = req.user.assignedLocation.split(',').map(loc => loc.trim());
      includeOptions.unshift({
        model: Borrower,
        as: 'borrower',
        where: { location: { [Op.in]: locations } },
        required: true
      });
    } else {
      includeOptions.unshift({
        model: Borrower,
        as: 'borrower'
      });
    }

    const loans = await Loan.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['status', 'ASC'], ['dueDate', 'ASC']]
    });

    // Use dynamic status computation for accurate categorization
    const loansWithEffectiveStatus = loans.map(loan => ({
      ...loan.toJSON(),
      status: computeEffectiveStatus(loan)
    }));

    const report = {
      active: loansWithEffectiveStatus.filter(l => l.status === 'active'),
      due: loansWithEffectiveStatus.filter(l => l.status === 'due'),
      pastDue: loansWithEffectiveStatus.filter(l => l.status === 'pastDue'),
      paid: loansWithEffectiveStatus.filter(l => l.status === 'paid'),
      defaulted: loansWithEffectiveStatus.filter(l => l.status === 'defaulted')
    };

    const summary = {
      totalLoans: loansWithEffectiveStatus.length,
      activeCount: report.active.length,
      dueCount: report.due.length,
      pastDueCount: report.pastDue.length,
      paidCount: report.paid.length,
      defaultedCount: report.defaulted.length
    };

    res.send({
      report: 'Loan Status Report',
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
      summary,
      loans: report
    });
  } catch (e) {
    console.error('Error generating Loan Status Report:', e);
    res.status(500).send({ error: e.message });
  }
};

/**
 * 3. Defaulters Report
 * Specific list of borrowers in "Defaulted" status with contact details and outstanding balance
 * Uses dynamic status computation to ensure accuracy regardless of stored database value
 */
const getDefaultersReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    // Don't filter by stored status - we'll compute effective status dynamically
    const whereClause = {};

    // Filter by date range if provided
    if (startDate && endDate) {
      whereClause.dateIssued = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.dateIssued = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.dateIssued = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Build include with location filter for employees
    const includeOptions = [
      { model: Collateral, as: 'collateral' }
    ];

    // Filter by assigned location for employees
    // Support multiple locations separated by comma (e.g., "JUJA,HIGHPOINT")
    if (req.user.role === 'employee' && req.user.assignedLocation) {
      const locations = req.user.assignedLocation.split(',').map(loc => loc.trim());
      includeOptions.unshift({
        model: Borrower,
        as: 'borrower',
        where: { location: { [Op.in]: locations } },
        required: true
      });
    } else {
      includeOptions.unshift({
        model: Borrower,
        as: 'borrower'
      });
    }

    const allLoans = await Loan.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['dueDate', 'ASC']]
    });

    // Filter to only defaulted loans using dynamic status computation
    const defaultedLoans = allLoans.filter(loan => computeEffectiveStatus(loan) === 'defaulted');

    const defaulters = defaultedLoans.map(loan => {
      // Use effective penalties (computed dynamically based on grace period)
      const effectivePenalties = computeEffectivePenalties(loan);
      const totalDue = parseFloat(loan.totalAmount) + effectivePenalties;
      const amountRepaid = parseFloat(loan.amountRepaid || 0);
      const outstandingBalance = totalDue - amountRepaid;

      return {
        loanId: loan.id,
        borrower: {
          id: loan.borrower.id,
          name: loan.borrower.fullName,
          idNumber: loan.borrower.idNumber,
          phoneNumber: loan.borrower.phoneNumber,
          email: loan.borrower.email,
          location: loan.borrower.location
        },
        loanDetails: {
          amountIssued: parseFloat(loan.amountIssued),
          interestRate: parseFloat(loan.interestRate),
          totalAmount: parseFloat(loan.totalAmount),
          penalties: effectivePenalties,
          amountRepaid: amountRepaid,
          outstandingBalance: outstandingBalance,
          dateIssued: loan.dateIssued,
          dueDate: loan.dueDate,
          gracePeriodEnd: loan.gracePeriodEnd
        },
        collateral: loan.collateral
      };
    });

    const totalOutstanding = defaulters.reduce((sum, d) => sum + d.loanDetails.outstandingBalance, 0);

    res.send({
      report: 'Defaulters Report',
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
      totalDefaulters: defaulters.length,
      totalOutstandingBalance: totalOutstanding,
      defaulters
    });
  } catch (e) {
    console.error('Error generating Defaulters Report:', e);
    res.status(500).send({ error: e.message });
  }
};

/**
 * 4. Defaulted Items Report
 * Tracking seized collateral categorized into Unsold and Sold
 */
const getDefaultedItemsReport = async (req, res) => {
  try {
    const { startDate, endDate, branchId } = req.query;
    const whereClause = {};

    // Filter by branch if user is not admin
    if (req.user.role !== 'admin') {
      whereClause.branchId = req.user.currentBranchId;
    } else if (branchId) {
      whereClause.branchId = branchId;
    }

    // Date range filter for defaulted date (when loan status became 'defaulted')
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.updatedAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      dateFilter.updatedAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      dateFilter.updatedAt = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Defaulted Items (Unsold) - Query from Loan with collateral relationship
    // Fetch all loans with seized unsold collateral, then filter by dynamic status
    const allUnsoldLoans = await Loan.findAll({
      where: {
        ...whereClause,
        ...dateFilter
      },
      include: [
        { model: Borrower, as: 'borrower' },
        {
          model: Collateral,
          as: 'collateral',
          where: {
            isSeized: true,
            isSold: false
          }
        }
      ],
      order: [['updatedAt', 'DESC']]
    });
    // Filter by dynamic status
    const unsoldLoans = allUnsoldLoans.filter(loan => computeEffectiveStatus(loan) === 'defaulted');

    // Defaulted Items (Sold) - Query from Loan with sold collateral
    const soldDateFilter = {};
    if (startDate && endDate) {
      soldDateFilter.soldDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      soldDateFilter.soldDate = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      soldDateFilter.soldDate = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Fetch all loans with sold collateral, then filter by dynamic status
    const allSoldLoans = await Loan.findAll({
      where: {
        ...whereClause
      },
      include: [
        { model: Borrower, as: 'borrower' },
        {
          model: Collateral,
          as: 'collateral',
          where: {
            isSold: true,
            ...(Object.keys(soldDateFilter).length > 0 ? soldDateFilter : {})
          }
        }
      ],
      order: [[{ model: Collateral, as: 'collateral' }, 'soldDate', 'DESC']]
    });
    // Filter by dynamic status
    const soldLoans = allSoldLoans.filter(loan => computeEffectiveStatus(loan) === 'defaulted');

    const totalRevenue = soldLoans.reduce((sum, loan) => sum + parseFloat(loan.collateral.soldPrice || 0), 0);

    // Format the data to match the required columns
    const unsoldData = unsoldLoans.map(loan => ({
      defaultedDate: loan.updatedAt,
      loanId: loan.loanId || `#${loan.id}`,
      itemId: loan.collateral.id,
      name: loan.borrower.fullName,
      idNumber: loan.borrower.idNumber,
      phoneNumber: loan.borrower.phoneNumber,
      item: loan.collateral.itemName
    }));

    const soldData = soldLoans.map(loan => ({
      defaultedDate: loan.updatedAt,
      itemId: loan.collateral.id,
      name: loan.borrower.fullName,
      idNumber: loan.borrower.idNumber,
      item: loan.collateral.itemName,
      modelNumber: loan.collateral.modelNumber || 'N/A',
      amount: loan.collateral.soldPrice,
      dateSold: loan.collateral.soldDate,
      phoneNumber: loan.borrower.phoneNumber,
      amountIssued: loan.amountIssued,
      amountPayable: loan.totalAmount
    }));

    res.send({
      report: 'Defaulted Items Report',
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
      unsold: {
        count: unsoldData.length,
        items: unsoldData
      },
      sold: {
        count: soldData.length,
        totalRevenue: totalRevenue,
        items: soldData
      }
    });
  } catch (e) {
    console.error('Error generating Defaulted Items Report:', e);
    res.status(500).send({ error: e.message });
  }
};

/**
 * 5. Balances Report
 * Summary of all outstanding receivables (money owed to the company)
 */
const getBalancesReport = async (req, res) => {
  try {
    const { startDate, endDate, branchId } = req.query;
    // Don't filter by stored status - we'll compute effective status dynamically
    const whereClause = {};

    // Filter by date range if provided
    if (startDate && endDate) {
      whereClause.dateIssued = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.dateIssued = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.dateIssued = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Filter by branch if user is not admin
    if (req.user.role !== 'admin') {
      whereClause.branchId = req.user.currentBranchId;
    } else if (branchId) {
      whereClause.branchId = branchId;
    }

    const allLoans = await Loan.findAll({
      where: whereClause,
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Collateral, as: 'collateral' }
      ]
    });

    // Apply dynamic status and filter out paid loans
    const outstandingLoans = allLoans
      .map(loan => ({
        ...loan.toJSON(),
        status: computeEffectiveStatus(loan)
      }))
      .filter(loan => loan.status !== 'paid');

    let totalPrincipal = 0;
    let totalInterest = 0;
    let totalPenalties = 0;
    let totalRepaid = 0;
    let totalOutstanding = 0;

    outstandingLoans.forEach(loan => {
      const principal = parseFloat(loan.amountIssued);
      const interest = parseFloat(loan.totalAmount) - principal;
      const penalties = parseFloat(loan.penalties || 0);
      const repaid = parseFloat(loan.amountRepaid || 0);
      const totalDue = parseFloat(loan.totalAmount) + penalties;
      const outstanding = totalDue - repaid;

      totalPrincipal += principal;
      totalInterest += interest;
      totalPenalties += penalties;
      totalRepaid += repaid;
      totalOutstanding += outstanding;
    });

    res.send({
      report: 'Balances Report',
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
      summary: {
        totalOutstandingLoans: outstandingLoans.length,
        totalPrincipalIssued: totalPrincipal,
        totalInterestExpected: totalInterest,
        totalPenaltiesAccrued: totalPenalties,
        totalAmountRepaid: totalRepaid,
        totalOutstandingReceivables: totalOutstanding
      },
      breakdown: {
        byStatus: {
          active: outstandingLoans.filter(l => l.status === 'active').length,
          due: outstandingLoans.filter(l => l.status === 'due').length,
          pastDue: outstandingLoans.filter(l => l.status === 'pastDue').length,
          defaulted: outstandingLoans.filter(l => l.status === 'defaulted').length
        }
      },
      loans: outstandingLoans
    });
  } catch (e) {
    console.error('Error generating Balances Report:', e);
    res.status(500).send({ error: e.message });
  }
};

/**
 * 6. "Not Yet Paid" Loans Report
 * Specific list of loans that are "Active" or "Past Due" but not yet fully paid
 */
const getNotYetPaidReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    // Don't filter by stored status - we'll compute effective status dynamically
    const whereClause = {};

    // Filter by date range if provided
    if (startDate && endDate) {
      whereClause.dateIssued = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.dateIssued = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.dateIssued = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Build include with location filter for employees
    const includeOptions = [
      { model: Collateral, as: 'collateral' }
    ];

    // Filter by assigned location for employees
    // Support multiple locations separated by comma (e.g., "JUJA,HIGHPOINT")
    if (req.user.role === 'employee' && req.user.assignedLocation) {
      const locations = req.user.assignedLocation.split(',').map(loc => loc.trim());
      includeOptions.unshift({
        model: Borrower,
        as: 'borrower',
        where: { location: { [Op.in]: locations } },
        required: true
      });
    } else {
      includeOptions.unshift({
        model: Borrower,
        as: 'borrower'
      });
    }

    const allLoans = await Loan.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['dueDate', 'ASC']]
    });

    // Filter to only loans that are active, due, or pastDue using dynamic status
    const notPaidLoans = allLoans.filter(loan => {
      const effectiveStatus = computeEffectiveStatus(loan);
      return ['active', 'due', 'pastDue'].includes(effectiveStatus);
    });

    const loansWithBalances = notPaidLoans.map(loan => {
      const totalDue = parseFloat(loan.totalAmount) + parseFloat(loan.penalties || 0);
      const amountRepaid = parseFloat(loan.amountRepaid || 0);
      const balance = totalDue - amountRepaid;

      return {
        ...loan.toJSON(),
        status: computeEffectiveStatus(loan),
        totalDue,
        balance
      };
    });

    const totalBalance = loansWithBalances.reduce((sum, loan) => sum + loan.balance, 0);

    res.send({
      report: 'Not Yet Paid Loans Report',
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
      totalLoans: loansWithBalances.length,
      totalOutstandingBalance: totalBalance,
      loans: loansWithBalances
    });
  } catch (e) {
    console.error('Error generating Not Yet Paid Report:', e);
    res.status(500).send({ error: e.message });
  }
};

/**
 * 7. Expenses Report
 * Detailed, filterable list of all logged operational expenses
 */
const getExpensesReport = async (req, res) => {
  try {
    const { startDate, endDate, category, branchId } = req.query;
    const whereClause = {};

    // Filter by date range if provided
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.date = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.date = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Filter by category if provided
    if (category) {
      whereClause.category = category;
    }

    // Filter by branch if user is not admin
    if (req.user.role !== 'admin') {
      whereClause.branchId = req.user.currentBranchId;
    } else if (branchId) {
      whereClause.branchId = branchId;
    }

    const expenses = await Expense.findAll({
      where: whereClause,
      order: [['date', 'DESC']]
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    // Group by category
    const byCategory = {};
    expenses.forEach(exp => {
      if (!byCategory[exp.category]) {
        byCategory[exp.category] = { count: 0, total: 0, expenses: [] };
      }
      byCategory[exp.category].count++;
      byCategory[exp.category].total += parseFloat(exp.amount);
      byCategory[exp.category].expenses.push(exp);
    });

    res.send({
      report: 'Expenses Report',
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
      summary: {
        totalExpenses: totalExpenses,
        expenseCount: expenses.length,
        categories: Object.keys(byCategory).length
      },
      byCategory,
      expenses
    });
  } catch (e) {
    console.error('Error generating Expenses Report:', e);
    res.status(500).send({ error: e.message });
  }
};

/**
 * 8. Profit & Loss Report (SECTION 3.1)
 * Automatically calculated P&L for selected period
 *
 * Total Revenue = (Interest Earned) + (Penalties Collected) + (Revenue from Sold Collateral)
 * Net Profit/Loss = (Total Revenue) - (Total Recorded Expenses)
 */
const getProfitLossReport = async (req, res) => {
  try {
    const { startDate, endDate, branchId } = req.query;
    const dateFilter = {};
    const expenseDateFilter = {};

    if (startDate && endDate) {
      dateFilter.dateIssued = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
      expenseDateFilter.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      dateFilter.dateIssued = {
        [Op.gte]: new Date(startDate)
      };
      expenseDateFilter.date = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      dateFilter.dateIssued = {
        [Op.lte]: new Date(endDate)
      };
      expenseDateFilter.date = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Apply branch filter
    if (req.user.role !== 'admin') {
      dateFilter.branchId = req.user.currentBranchId;
      expenseDateFilter.branchId = req.user.currentBranchId;
    } else if (branchId) {
      dateFilter.branchId = branchId;
      expenseDateFilter.branchId = branchId;
    }

    // Get all loans in the period
    const loans = await Loan.findAll({
      where: dateFilter
    });

    // Calculate Interest Earned
    // Interest = Total Amount - Principal (only for paid or partially paid loans)
    let interestEarned = 0;
    loans.forEach(loan => {
      const principal = parseFloat(loan.amountIssued);
      const totalAmount = parseFloat(loan.totalAmount);
      const interest = totalAmount - principal;
      const repaid = parseFloat(loan.amountRepaid || 0);

      // Interest earned is proportional to amount repaid
      const interestCollected = (repaid / totalAmount) * interest;
      interestEarned += interestCollected;
    });

    // Calculate Penalties Collected
    let penaltiesCollected = 0;
    loans.forEach(loan => {
      const penalties = parseFloat(loan.penalties || 0);
      const totalDue = parseFloat(loan.totalAmount) + penalties;
      const repaid = parseFloat(loan.amountRepaid || 0);

      // If repaid more than totalAmount, the excess is penalty collection
      if (repaid > parseFloat(loan.totalAmount)) {
        const penaltyPaid = repaid - parseFloat(loan.totalAmount);
        penaltiesCollected += Math.min(penaltyPaid, penalties);
      }
    });

    // Calculate Revenue from Sold Collateral
    const soldCollateralFilter = { isSold: true };
    if (startDate && endDate) {
      soldCollateralFilter.soldDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    if (req.user.role !== 'admin') {
      soldCollateralFilter.branchId = req.user.currentBranchId;
    } else if (branchId) {
      soldCollateralFilter.branchId = branchId;
    }

    const soldCollateral = await Collateral.findAll({
      where: soldCollateralFilter
    });

    const revenueFromSoldCollateral = soldCollateral.reduce((sum, item) => {
      return sum + parseFloat(item.soldPrice || 0);
    }, 0);

    // Total Revenue
    const totalRevenue = interestEarned + penaltiesCollected + revenueFromSoldCollateral;

    // Get Total Expenses
    const expenses = await Expense.findAll({
      where: expenseDateFilter
    });

    const totalExpenses = expenses.reduce((sum, exp) => {
      return sum + parseFloat(exp.amount);
    }, 0);

    // Net Profit/Loss
    const netProfitLoss = totalRevenue - totalExpenses;

    res.send({
      report: 'Profit & Loss Report',
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
      revenue: {
        interestEarned: parseFloat(interestEarned.toFixed(2)),
        penaltiesCollected: parseFloat(penaltiesCollected.toFixed(2)),
        revenueFromSoldCollateral: parseFloat(revenueFromSoldCollateral.toFixed(2)),
        totalRevenue: parseFloat(totalRevenue.toFixed(2))
      },
      expenses: {
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        expenseCount: expenses.length
      },
      profitLoss: {
        netProfitLoss: parseFloat(netProfitLoss.toFixed(2)),
        profitMargin: totalRevenue > 0 ? parseFloat(((netProfitLoss / totalRevenue) * 100).toFixed(2)) : 0,
        isProfitable: netProfitLoss >= 0
      }
    });
  } catch (e) {
    console.error('Error generating Profit & Loss Report:', e);
    res.status(500).send({ error: e.message });
  }
};

/**
 * 9. Paid Loans Report
 * List of all loans that have been fully paid
 */
const getPaidLoansReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = {
      status: 'paid'
    };

    // Filter by payment date range if provided
    if (startDate && endDate) {
      whereClause.lastPaymentDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.lastPaymentDate = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.lastPaymentDate = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Build include with location filter for employees
    const includeOptions = [
      { model: Collateral, as: 'collateral' }
    ];

    // Filter by assigned location for employees
    if (req.user.role === 'employee' && req.user.assignedLocation) {
      const locations = req.user.assignedLocation.split(',').map(loc => loc.trim());
      includeOptions.unshift({
        model: Borrower,
        as: 'borrower',
        where: { location: { [Op.in]: locations } },
        required: true
      });
    } else {
      includeOptions.unshift({
        model: Borrower,
        as: 'borrower'
      });
    }

    const loans = await Loan.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['lastPaymentDate', 'DESC']]
    });

    // Calculate totals
    const totalPrincipalPaid = loans.reduce((sum, loan) => sum + parseFloat(loan.amountIssued), 0);
    const totalInterestPaid = loans.reduce((sum, loan) => sum + (parseFloat(loan.totalAmount) - parseFloat(loan.amountIssued)), 0);
    const totalPenaltiesPaid = loans.reduce((sum, loan) => sum + parseFloat(loan.penalties || 0), 0);
    const totalAmountCollected = loans.reduce((sum, loan) => sum + parseFloat(loan.amountRepaid || 0), 0);

    const paidLoans = loans.map(loan => ({
      loanId: loan.id,
      borrower: {
        id: loan.borrower?.id,
        name: loan.borrower?.fullName,
        idNumber: loan.borrower?.idNumber,
        phoneNumber: loan.borrower?.phoneNumber,
        location: loan.borrower?.location
      },
      collateral: loan.collateral ? {
        itemName: loan.collateral.itemName,
        category: loan.collateral.category
      } : null,
      loanDetails: {
        amountIssued: parseFloat(loan.amountIssued),
        interestRate: parseFloat(loan.interestRate),
        totalAmount: parseFloat(loan.totalAmount),
        penalties: parseFloat(loan.penalties || 0),
        amountRepaid: parseFloat(loan.amountRepaid || 0)
      },
      dates: {
        dateIssued: loan.dateIssued,
        dueDate: loan.dueDate,
        lastPaymentDate: loan.lastPaymentDate
      }
    }));

    res.send({
      report: 'Paid Loans Report',
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
      summary: {
        totalPaidLoans: loans.length,
        totalPrincipalPaid: parseFloat(totalPrincipalPaid.toFixed(2)),
        totalInterestPaid: parseFloat(totalInterestPaid.toFixed(2)),
        totalPenaltiesPaid: parseFloat(totalPenaltiesPaid.toFixed(2)),
        totalAmountCollected: parseFloat(totalAmountCollected.toFixed(2))
      },
      paidLoans
    });
  } catch (e) {
    console.error('Error generating Paid Loans Report:', e);
    res.status(500).send({ error: e.message });
  }
};

module.exports = {
  getLoansIssuedReport,
  getLoanStatusReport,
  getDefaultersReport,
  getDefaultedItemsReport,
  getBalancesReport,
  getNotYetPaidReport,
  getExpensesReport,
  getProfitLossReport,
  getPaidLoansReport
};
