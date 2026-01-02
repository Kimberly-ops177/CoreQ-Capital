const { Op, fn, col } = require('sequelize');
const Loan = require('../models/Loan');
const Expense = require('../models/Expense');
const Collateral = require('../models/Collateral');
const Borrower = require('../models/Borrower');

const getPnL = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Interest earned from paid loans in period
    const paidLoans = await Loan.findAll({
      where: {
        status: 'paid',
        agreementStatus: 'approved',
        dateIssued: { [Op.between]: [start, end] }
      }
    });
    const interestEarned = paidLoans.reduce((sum, loan) => sum + (loan.totalAmount - loan.amountIssued), 0);

    // Penalties collected from paid loans
    const penaltiesCollected = paidLoans.reduce((sum, loan) => sum + (loan.penalties || 0), 0);

    // Revenue from sold collateral
    const soldCollaterals = await Collateral.findAll({
      where: {
        isSold: true,
        createdAt: { [Op.between]: [start, end] }
      }
    });
    const collateralRevenue = soldCollaterals.reduce((sum, col) => sum + (col.soldPrice || 0), 0);

    const totalRevenue = interestEarned + penaltiesCollected + collateralRevenue;

    // Total expenses
    const expenses = await Expense.findAll({
      where: {
        date: { [Op.between]: [start, end] }
      }
    });
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    const netProfitLoss = totalRevenue - totalExpenses;

    res.send({
      period: { startDate, endDate },
      totalRevenue,
      interestEarned,
      penaltiesCollected,
      collateralRevenue,
      totalExpenses,
      netProfitLoss
    });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

const getAdminDashboardData = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total Loaned Principal
    const totalLoanedResult = await Loan.findOne({
      attributes: [[fn('SUM', col('amountIssued')), 'total']],
      where: { agreementStatus: 'approved' },
      raw: true
    });
    const totalLoanedPrincipal = parseFloat(totalLoanedResult?.total || 0);

    // Total Outstanding Receivables
    const outstandingLoans = await Loan.findAll({
      where: {
        status: { [Op.ne]: 'paid' },
        agreementStatus: 'approved'
      }
    });
    const totalOutstanding = outstandingLoans.reduce((sum, loan) => {
      const principalPlusInterest = parseFloat(loan.totalAmount) || 0;
      const penalties = parseFloat(loan.penalties || 0);
      const repaid = parseFloat(loan.amountRepaid || 0);
      const totalDue = principalPlusInterest + penalties;
      const outstanding = Math.max(0, totalDue - repaid);
      return sum + outstanding;
    }, 0);

    // Active Loans
    const activeLoansCount = await Loan.count({ where: { status: 'active', agreementStatus: 'approved' } });

    // Defaulted Loans
    const defaultedLoansCount = await Loan.count({ where: { status: 'defaulted', agreementStatus: 'approved' } });

    // Month-to-Date Profit/Loss
    const monthPnL = await getPnLData(monthStart, now);

    // Month-to-Date Expenses
    const monthExpenses = await Expense.findAll({
      where: {
        date: { [Op.between]: [monthStart, now] }
      }
    });
    const totalMonthExpenses = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    res.send({
      totalLoanedPrincipal,
      totalOutstandingReceivables: totalOutstanding,
      totalActiveLoans: activeLoansCount,
      totalDefaultedLoans: defaultedLoansCount,
      monthToDateProfitLoss: monthPnL.netProfitLoss,
      monthToDateExpenses: totalMonthExpenses
    });
  } catch (e) {
    console.error('[getAdminDashboardData] Error:', e);
    res.status(500).send({ error: e.message });
  }
};

const getEmployeeDashboardData = async (req, res) => {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build location filter for employees
    // Support multiple locations separated by comma (e.g., "JUJA,HIGHPOINT")
    let locationFilter = {};
    const hasLocationFilter = req.user.role === 'employee' && req.user.assignedLocation;

    if (hasLocationFilter) {
      const locations = req.user.assignedLocation.split(',').map(loc => loc.trim());
      locationFilter = { location: { [Op.in]: locations } };
    }

    // Loans Due This Week (filtered by borrower location for employees)
    const loansDueThisWeek = await Loan.count({
      where: {
        dueDate: { [Op.between]: [weekStart, weekEnd] },
        status: { [Op.in]: ['active', 'due'] },
        agreementStatus: 'approved'
      },
      include: hasLocationFilter ? [{
        model: Borrower,
        as: 'borrower',
        where: locationFilter,
        attributes: []
      }] : []
    });

    // Loans in Grace Period (filtered by borrower location for employees)
    const loansInGrace = await Loan.count({
      where: { status: 'pastDue', agreementStatus: 'approved' },
      include: hasLocationFilter ? [{
        model: Borrower,
        as: 'borrower',
        where: locationFilter,
        attributes: []
      }] : []
    });

    // New Borrowers Registered Today (filtered by location for employees)
    const newBorrowersToday = await Borrower.count({
      where: {
        createdAt: { [Op.gte]: todayStart },
        ...locationFilter
      }
    });

    // Total Loans Issued Today (filtered by borrower location for employees)
    const loansIssuedToday = await Loan.count({
      where: {
        dateIssued: { [Op.gte]: todayStart },
        agreementStatus: 'approved'
      },
      include: hasLocationFilter ? [{
        model: Borrower,
        as: 'borrower',
        where: locationFilter,
        attributes: []
      }] : []
    });

    // Total Loans Issued This Week (filtered by borrower location for employees)
    const loansIssuedThisWeek = await Loan.count({
      where: {
        dateIssued: { [Op.gte]: weekStart },
        agreementStatus: 'approved'
      },
      include: hasLocationFilter ? [{
        model: Borrower,
        as: 'borrower',
        where: locationFilter,
        attributes: []
      }] : []
    });

    // Total Loaned Principal (filtered by location for employees)
    let totalLoanedPrincipal = 0;
    if (hasLocationFilter) {
      const loanedResult = await Loan.sum('amountIssued', {
        where: { agreementStatus: 'approved' },
        include: [{
          model: Borrower,
          as: 'borrower',
          where: locationFilter,
          attributes: []
        }]
      });
      totalLoanedPrincipal = parseFloat(loanedResult || 0);
    } else {
      const loanedResult = await Loan.sum('amountIssued', {
        where: { agreementStatus: 'approved' }
      });
      totalLoanedPrincipal = parseFloat(loanedResult || 0);
    }

    // Total Outstanding Receivables (filtered by location for employees)
    const outstandingLoans = await Loan.findAll({
      where: {
        status: { [Op.ne]: 'paid' },
        agreementStatus: 'approved'
      },
      include: hasLocationFilter ? [{
        model: Borrower,
        as: 'borrower',
        where: locationFilter
      }] : [{
        model: Borrower,
        as: 'borrower'
      }]
    });
    const totalOutstanding = outstandingLoans.reduce((sum, loan) => {
      const principalPlusInterest = parseFloat(loan.totalAmount) || 0;
      const penalties = parseFloat(loan.penalties || 0);
      const repaid = parseFloat(loan.amountRepaid || 0);
      const totalDue = principalPlusInterest + penalties;
      const outstanding = Math.max(0, totalDue - repaid);
      return sum + outstanding;
    }, 0);

    // Active Loans (filtered by location for employees)
    const activeLoansCount = await Loan.count({
      where: { status: 'active', agreementStatus: 'approved' },
      include: hasLocationFilter ? [{
        model: Borrower,
        as: 'borrower',
        where: locationFilter,
        attributes: []
      }] : []
    });

    // Defaulted Loans (filtered by location for employees)
    const defaultedLoansCount = await Loan.count({
      where: { status: 'defaulted', agreementStatus: 'approved' },
      include: hasLocationFilter ? [{
        model: Borrower,
        as: 'borrower',
        where: locationFilter,
        attributes: []
      }] : []
    });

    // Month-to-Date Expenses (filtered by location for employees if applicable)
    let totalMonthExpenses = 0;
    if (hasLocationFilter) {
      // For now, include all expenses since expenses aren't tied to location
      // In future, you could add location tracking to expenses
      const monthExpenses = await Expense.findAll({
        where: {
          date: { [Op.between]: [monthStart, now] }
        }
      });
      totalMonthExpenses = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    } else {
      const monthExpenses = await Expense.findAll({
        where: {
          date: { [Op.between]: [monthStart, now] }
        }
      });
      totalMonthExpenses = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    }

    // Month-to-Date Revenue (filtered by location for employees)
    const paidLoansThisMonth = await Loan.findAll({
      where: {
        status: 'paid',
        agreementStatus: 'approved',
        lastPaymentDate: { [Op.between]: [monthStart, now] }
      },
      include: hasLocationFilter ? [{
        model: Borrower,
        as: 'borrower',
        where: locationFilter
      }] : [{
        model: Borrower,
        as: 'borrower'
      }]
    });
    const interestEarned = paidLoansThisMonth.reduce((sum, loan) => sum + (parseFloat(loan.totalAmount) - parseFloat(loan.amountIssued)), 0);
    const penaltiesCollected = paidLoansThisMonth.reduce((sum, loan) => sum + parseFloat(loan.penalties || 0), 0);
    const totalRevenue = interestEarned + penaltiesCollected;
    const monthToDateProfitLoss = totalRevenue - totalMonthExpenses;

    res.send({
      // Original metrics
      loansDueThisWeek,
      loansInGracePeriod: loansInGrace,
      newBorrowersRegisteredToday: newBorrowersToday,
      totalLoansIssuedToday: loansIssuedToday,
      totalLoansIssuedThisWeek: loansIssuedThisWeek,
      // New metrics matching admin dashboard
      totalLoanedPrincipal,
      totalOutstandingReceivables: totalOutstanding,
      totalActiveLoans: activeLoansCount,
      totalDefaultedLoans: defaultedLoansCount,
      monthToDateProfitLoss,
      monthToDateExpenses: totalMonthExpenses
    });
  } catch (e) {
    console.error('[getEmployeeDashboardData] Error:', e);
    res.status(500).send({ error: e.message });
  }
};

const getPnLData = async (start, end) => {
  const paidLoans = await Loan.findAll({
    where: {
      status: 'paid',
      agreementStatus: 'approved',
      dateIssued: { [Op.between]: [start, end] }
    }
  });
  const interestEarned = paidLoans.reduce((sum, loan) => sum + (loan.totalAmount - loan.amountIssued), 0);
  const penaltiesCollected = paidLoans.reduce((sum, loan) => sum + (loan.penalties || 0), 0);

  const soldCollaterals = await Collateral.findAll({
    where: {
      isSold: true,
      createdAt: { [Op.between]: [start, end] }
    }
  });
  const collateralRevenue = soldCollaterals.reduce((sum, col) => sum + (col.soldPrice || 0), 0);

  const totalRevenue = interestEarned + penaltiesCollected + collateralRevenue;

  const expenses = await Expense.findAll({
    where: {
      date: { [Op.between]: [start, end] }
    }
  });
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  const netProfitLoss = totalRevenue - totalExpenses;
  return { totalRevenue, interestEarned, penaltiesCollected, collateralRevenue, totalExpenses, netProfitLoss };
};

module.exports = { getPnL, getAdminDashboardData, getEmployeeDashboardData };
