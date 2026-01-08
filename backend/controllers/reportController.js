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

    const report = {
      active: loans.filter(l => l.status === 'active'),
      due: loans.filter(l => l.status === 'due'),
      pastDue: loans.filter(l => l.status === 'pastDue'),
      paid: loans.filter(l => l.status === 'paid'),
      defaulted: loans.filter(l => l.status === 'defaulted')
    };

    const summary = {
      totalLoans: loans.length,
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
 */
const getDefaultersReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = { status: 'defaulted' };

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

    const defaultedLoans = await Loan.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['dueDate', 'ASC']]
    });

    const defaulters = defaultedLoans.map(loan => {
      const totalDue = parseFloat(loan.totalAmount) + parseFloat(loan.penalties || 0);
      const amountRepaid = parseFloat(loan.amountRepaid || 0);
      const outstandingBalance = totalDue - amountRepaid;

      return {
        loanId: loan.id,
        borrower: {
          id: loan.borrower.id,
          name: loan.borrower.name,
          idNumber: loan.borrower.idNumber,
          phoneNumber: loan.borrower.phoneNumber,
          email: loan.borrower.email,
          address: loan.borrower.address
        },
        loanDetails: {
          amountIssued: parseFloat(loan.amountIssued),
          interestRate: parseFloat(loan.interestRate),
          totalAmount: parseFloat(loan.totalAmount),
          penalties: parseFloat(loan.penalties || 0),
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

    // Date range filter for seized date
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      dateFilter.createdAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      dateFilter.createdAt = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Defaulted Items (Unsold) - Items that are seized but not yet sold
    const unsoldItems = await Collateral.findAll({
      where: {
        ...whereClause,
        ...dateFilter,
        isSeized: true,
        isSold: false
      },
      include: [{ model: Borrower, as: 'borrower' }],
      order: [['createdAt', 'DESC']]
    });

    // Defaulted Items (Sold) - Items that have been sold
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

    const soldItems = await Collateral.findAll({
      where: {
        ...whereClause,
        ...(Object.keys(soldDateFilter).length > 0 ? soldDateFilter : {}),
        isSold: true
      },
      include: [{ model: Borrower, as: 'borrower' }],
      order: [['soldDate', 'DESC']]
    });

    const totalRevenue = soldItems.reduce((sum, item) => sum + parseFloat(item.soldPrice || 0), 0);

    res.send({
      report: 'Defaulted Items Report',
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
      unsold: {
        count: unsoldItems.length,
        items: unsoldItems
      },
      sold: {
        count: soldItems.length,
        totalRevenue: totalRevenue,
        items: soldItems
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
    const whereClause = {
      status: { [Op.ne]: 'paid' }
    };

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

    const outstandingLoans = await Loan.findAll({
      where: whereClause,
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Collateral, as: 'collateral' }
      ]
    });

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
    const whereClause = {
      status: { [Op.in]: ['active', 'due', 'pastDue'] }
    };

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

    const notPaidLoans = await Loan.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['dueDate', 'ASC']]
    });

    const loansWithBalances = notPaidLoans.map(loan => {
      const totalDue = parseFloat(loan.totalAmount) + parseFloat(loan.penalties || 0);
      const amountRepaid = parseFloat(loan.amountRepaid || 0);
      const balance = totalDue - amountRepaid;

      return {
        ...loan.toJSON(),
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

module.exports = {
  getLoansIssuedReport,
  getLoanStatusReport,
  getDefaultersReport,
  getDefaultedItemsReport,
  getBalancesReport,
  getNotYetPaidReport,
  getExpensesReport,
  getProfitLossReport
};
