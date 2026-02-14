const { Op, fn, col } = require('sequelize');
const Loan = require('../models/Loan');
const Expense = require('../models/Expense');
const Collateral = require('../models/Collateral');
const Borrower = require('../models/Borrower');

// Business rules constants
const GRACE_PERIOD_DAYS = 7;
const DAILY_PENALTY_RATE = 3; // 3% per day

/**
 * Compute effective penalties based on current date
 */
const computeEffectivePenalties = (loan) => {
  const now = new Date();
  const dueDate = new Date(loan.dueDate);
  const gracePeriodEnd = new Date(loan.gracePeriodEnd);
  const storedPenalties = parseFloat(loan.penalties || 0);

  if (now <= dueDate) {
    return storedPenalties;
  }

  const outstandingAmount = parseFloat(loan.totalAmount) - parseFloat(loan.amountRepaid || 0);

  if (outstandingAmount <= 0) {
    return storedPenalties;
  }

  let daysOverdue;
  if (now >= gracePeriodEnd) {
    daysOverdue = GRACE_PERIOD_DAYS;
  } else {
    daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
    daysOverdue = Math.min(daysOverdue, GRACE_PERIOD_DAYS);
  }

  if (daysOverdue <= 0) {
    return storedPenalties;
  }

  const dailyPenaltyAmount = outstandingAmount * (DAILY_PENALTY_RATE / 100);
  const calculatedPenalties = dailyPenaltyAmount * daysOverdue;

  return Math.max(storedPenalties, calculatedPenalties);
};

/**
 * Compute effective loan status based on current date
 */
const computeEffectiveStatus = (loan) => {
  const now = new Date();
  const dueDate = new Date(loan.dueDate);
  const gracePeriodEnd = new Date(loan.gracePeriodEnd);
  const effectivePenalties = computeEffectivePenalties(loan);
  const totalDue = parseFloat(loan.totalAmount) + effectivePenalties;
  const amountRepaid = parseFloat(loan.amountRepaid || 0);

  if (amountRepaid >= totalDue) return 'paid';
  if (now >= gracePeriodEnd) return 'defaulted';
  if (now >= dueDate) return 'pastDue';
  if (now.toDateString() === dueDate.toDateString()) return 'due';
  return 'active';
};

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
    const interestEarned = paidLoans.reduce((sum, loan) => sum + (parseFloat(loan.totalAmount) - parseFloat(loan.amountIssued)), 0);

    // Penalties collected from paid loans
    const penaltiesCollected = paidLoans.reduce((sum, loan) => sum + parseFloat(loan.penalties || 0), 0);

    // Revenue from sold collateral
    const soldCollaterals = await Collateral.findAll({
      where: {
        isSold: true,
        createdAt: { [Op.between]: [start, end] }
      }
    });
    const collateralRevenue = soldCollaterals.reduce((sum, col) => sum + parseFloat(col.soldPrice || 0), 0);

    const totalRevenue = parseFloat(interestEarned) + parseFloat(penaltiesCollected) + parseFloat(collateralRevenue);

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
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month

    console.log('=== DASHBOARD DEBUG ===');
    console.log('Current Date:', now.toISOString());
    console.log('Month Start:', monthStart.toISOString());
    console.log('Month End:', monthEnd.toISOString());

    // Total Loaned Principal
    const totalLoanedResult = await Loan.findOne({
      attributes: [[fn('SUM', col('amountIssued')), 'total']],
      where: { agreementStatus: 'approved' },
      raw: true
    });
    const totalLoanedPrincipal = parseFloat(totalLoanedResult?.total || 0);
    console.log('Total Loaned Principal:', totalLoanedPrincipal);

    // Total Outstanding Receivables - use effective penalties
    const outstandingLoans = await Loan.findAll({
      where: {
        status: { [Op.ne]: 'paid' },
        agreementStatus: 'approved'
      }
    });
    console.log('Outstanding Loans Count:', outstandingLoans.length);
    const totalOutstanding = outstandingLoans.reduce((sum, loan) => {
      const principalPlusInterest = parseFloat(loan.totalAmount) || 0;
      const effectivePenalties = computeEffectivePenalties(loan);
      const repaid = parseFloat(loan.amountRepaid || 0);
      const totalDue = principalPlusInterest + effectivePenalties;
      const outstanding = Math.max(0, totalDue - repaid);
      console.log(`  Loan #${loan.loanId}: Total=${principalPlusInterest}, Penalties=${effectivePenalties}, Repaid=${repaid}, Outstanding=${outstanding}`);
      return sum + outstanding;
    }, 0);
    console.log('Total Outstanding Receivables:', totalOutstanding);

    // Active and Defaulted Loans - compute effective status dynamically
    const allApprovedLoans = await Loan.findAll({
      where: { agreementStatus: 'approved' },
      attributes: ['id', 'status', 'dueDate', 'gracePeriodEnd', 'totalAmount', 'penalties', 'amountRepaid']
    });

    const loansWithEffectiveStatus = allApprovedLoans.map(loan => ({
      ...loan.toJSON(),
      effectiveStatus: computeEffectiveStatus(loan)
    }));

    const activeLoansCount = loansWithEffectiveStatus.filter(l => l.effectiveStatus === 'active').length;
    const pastDueLoansCount = loansWithEffectiveStatus.filter(l => l.effectiveStatus === 'pastDue').length;
    const defaultedLoansCount = loansWithEffectiveStatus.filter(l => l.effectiveStatus === 'defaulted').length;
    console.log('Active Loans Count (computed):', activeLoansCount);
    console.log('Past Due Loans Count (computed):', pastDueLoansCount);
    console.log('Defaulted Loans Count (computed):', defaultedLoansCount);

    // Month-to-Date Profit/Loss (includes all current month data)
    const monthPnL = await getPnLData(monthStart, monthEnd);
    console.log('Month-to-Date P/L:', monthPnL);
    console.log('=== END DASHBOARD DEBUG ===');

    // Month-to-Date Expenses (includes all expenses in current month)
    const monthExpenses = await Expense.findAll({
      where: {
        date: { [Op.between]: [monthStart, monthEnd] }
      }
    });
    const totalMonthExpenses = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    res.send({
      totalLoanedPrincipal,
      totalOutstandingReceivables: totalOutstanding,
      totalActiveLoans: activeLoansCount,
      totalPastDueLoans: pastDueLoansCount,
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
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month

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

    // Total Outstanding Receivables (filtered by location for employees) - use effective penalties
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
      const effectivePenalties = computeEffectivePenalties(loan);
      const repaid = parseFloat(loan.amountRepaid || 0);
      const totalDue = principalPlusInterest + effectivePenalties;
      const outstanding = Math.max(0, totalDue - repaid);
      return sum + outstanding;
    }, 0);

    // Active and Defaulted Loans - compute effective status dynamically (filtered by location for employees)
    const allApprovedLoans = await Loan.findAll({
      where: { agreementStatus: 'approved' },
      attributes: ['id', 'status', 'dueDate', 'gracePeriodEnd', 'totalAmount', 'penalties', 'amountRepaid'],
      include: hasLocationFilter ? [{
        model: Borrower,
        as: 'borrower',
        where: locationFilter,
        attributes: ['id']
      }] : []
    });

    const loansWithEffectiveStatus = allApprovedLoans.map(loan => ({
      ...loan.toJSON(),
      effectiveStatus: computeEffectiveStatus(loan)
    }));

    const activeLoansCount = loansWithEffectiveStatus.filter(l => l.effectiveStatus === 'active').length;
    const pastDueLoansCount = loansWithEffectiveStatus.filter(l => l.effectiveStatus === 'pastDue').length;
    const defaultedLoansCount = loansWithEffectiveStatus.filter(l => l.effectiveStatus === 'defaulted').length;

    // Month-to-Date Expenses (includes all expenses in current month)
    let totalMonthExpenses = 0;
    if (hasLocationFilter) {
      // For now, include all expenses since expenses aren't tied to location
      // In future, you could add location tracking to expenses
      const monthExpenses = await Expense.findAll({
        where: {
          date: { [Op.between]: [monthStart, monthEnd] }
        }
      });
      totalMonthExpenses = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    } else {
      const monthExpenses = await Expense.findAll({
        where: {
          date: { [Op.between]: [monthStart, monthEnd] }
        }
      });
      totalMonthExpenses = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    }

    // Month-to-Date Revenue (filtered by location for employees, includes all current month data)
    const paidLoansThisMonth = await Loan.findAll({
      where: {
        status: 'paid',
        agreementStatus: 'approved',
        lastPaymentDate: { [Op.between]: [monthStart, monthEnd] }
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
    const totalRevenue = parseFloat(interestEarned) + parseFloat(penaltiesCollected);
    const monthToDateProfitLoss = parseFloat(totalRevenue) - parseFloat(totalMonthExpenses);

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
      totalPastDueLoans: pastDueLoansCount,
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
  console.log('  [P/L Debug] Calculating P/L between:', start.toISOString(), 'and', end.toISOString());

  const paidLoans = await Loan.findAll({
    where: {
      status: 'paid',
      agreementStatus: 'approved',
      dateIssued: { [Op.between]: [start, end] }
    }
  });

  console.log('  [P/L Debug] Found', paidLoans.length, 'paid loans issued in this period');
  paidLoans.forEach(loan => {
    const interest = loan.totalAmount - loan.amountIssued;
    console.log(`    Loan #${loan.loanId}: Issued=${loan.dateIssued?.toISOString()}, Principal=${loan.amountIssued}, Interest=${interest}, Penalties=${loan.penalties || 0}`);
  });

  const interestEarned = paidLoans.reduce((sum, loan) => sum + (parseFloat(loan.totalAmount) - parseFloat(loan.amountIssued)), 0);
  const penaltiesCollected = paidLoans.reduce((sum, loan) => sum + parseFloat(loan.penalties || 0), 0);

  const soldCollaterals = await Collateral.findAll({
    where: {
      isSold: true,
      createdAt: { [Op.between]: [start, end] }
    }
  });
  console.log('  [P/L Debug] Found', soldCollaterals.length, 'sold collaterals in this period');
  const collateralRevenue = soldCollaterals.reduce((sum, col) => sum + parseFloat(col.soldPrice || 0), 0);

  const totalRevenue = parseFloat(interestEarned) + parseFloat(penaltiesCollected) + parseFloat(collateralRevenue);

  const expenses = await Expense.findAll({
    where: {
      date: { [Op.between]: [start, end] }
    }
  });
  console.log('  [P/L Debug] Found', expenses.length, 'expenses in this period');
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  const netProfitLoss = totalRevenue - totalExpenses;
  console.log('  [P/L Debug] Interest:', interestEarned, 'Penalties:', penaltiesCollected, 'Collateral:', collateralRevenue, 'Expenses:', totalExpenses, 'Net P/L:', netProfitLoss);

  return { totalRevenue, interestEarned, penaltiesCollected, collateralRevenue, totalExpenses, netProfitLoss };
};

module.exports = { getPnL, getAdminDashboardData, getEmployeeDashboardData };
