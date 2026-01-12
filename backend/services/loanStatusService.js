const Loan = require('../models/Loan');
const Borrower = require('../models/Borrower');
const Collateral = require('../models/Collateral');
const { sendDueDateReminder, sendDefaultNotification } = require('./notificationService');
const { Op } = require('sequelize');

// BUSINESS RULES FROM INSTRUCTIONS (Section 2.4)
const GRACE_PERIOD_DAYS = 7;           // 7-day grace period after due date
const DAILY_PENALTY_RATE = 3;          // 3% per day during grace period

/**
 * Calculate penalty for a loan during grace period
 * Per instructions: "a penalty of 3% per day is applied to the outstanding amount"
 */
const calculatePenalty = (loan) => {
  const now = new Date();
  const dueDate = new Date(loan.dueDate);
  const gracePeriodEnd = new Date(loan.gracePeriodEnd);

  // No penalty before due date
  if (now < dueDate) {
    return 0;
  }

  // No additional penalty after grace period (loan is defaulted)
  if (now > gracePeriodEnd) {
    return parseFloat(loan.penalties || 0);
  }

  // Calculate days in grace period
  const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

  if (daysOverdue <= 0) {
    return 0;
  }

  // Get the last date penalty was calculated
  const lastPenaltyDate = loan.lastPenaltyDate ? new Date(loan.lastPenaltyDate) : dueDate;
  const daysSinceLastPenalty = Math.floor((now - lastPenaltyDate) / (1000 * 60 * 60 * 24));

  if (daysSinceLastPenalty <= 0) {
    return parseFloat(loan.penalties || 0);
  }

  // Calculate outstanding amount (what penalty is applied to)
  const outstandingAmount = parseFloat(loan.totalAmount) - parseFloat(loan.amountRepaid || 0);

  // Calculate new penalty: 3% per day on outstanding amount
  const dailyPenaltyAmount = outstandingAmount * (DAILY_PENALTY_RATE / 100);
  const newPenalty = dailyPenaltyAmount * daysSinceLastPenalty;
  const totalPenalties = parseFloat(loan.penalties || 0) + newPenalty;

  return totalPenalties;
};

/**
 * Update loan status based on current date and payment status
 * Per instructions: System automatically flags loan as "Defaulted" after grace period
 */
const updateLoanStatus = async (loan) => {
  const now = new Date();
  const dueDate = new Date(loan.dueDate);
  const gracePeriodEnd = new Date(loan.gracePeriodEnd);
  const totalDue = parseFloat(loan.totalAmount) + parseFloat(loan.penalties || 0);
  const amountRepaid = parseFloat(loan.amountRepaid || 0);
  const isPaid = amountRepaid >= totalDue;

  let newStatus = loan.status;
  let statusChanged = false;

  // If paid in full, status is 'paid'
  if (isPaid) {
    if (loan.status !== 'paid') {
      newStatus = 'paid';
      statusChanged = true;
    }
  }
  // If beyond grace period and not paid, status is 'defaulted'
  else if (now > gracePeriodEnd) {
    if (loan.status !== 'defaulted') {
      newStatus = 'defaulted';
      statusChanged = true;
    }
  }
  // If past due date but within grace period, status is 'pastDue'
  else if (now > dueDate) {
    if (loan.status !== 'pastDue') {
      newStatus = 'pastDue';
      statusChanged = true;
    }
  }
  // If due today, status is 'due'
  else if (now.toDateString() === dueDate.toDateString()) {
    if (loan.status !== 'due') {
      newStatus = 'due';
      statusChanged = true;
    }
  }
  // Otherwise, status is 'active'
  else {
    if (loan.status !== 'active' && loan.status !== 'paid') {
      newStatus = 'active';
      statusChanged = true;
    }
  }

  return { newStatus, statusChanged };
};

/**
 * Process all loans - update statuses, apply penalties, send notifications
 * This should be run daily via cron job
 */
const processAllLoans = async () => {
  try {
    console.log('Starting loan status processing...');
    const now = new Date();

    // Get all non-paid loans
    const loans = await Loan.findAll({
      where: {
        status: { [Op.ne]: 'paid' }
      },
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Collateral, as: 'collateral' }
      ]
    });

    console.log(`Processing ${loans.length} active loans...`);

    const results = {
      updated: 0,
      penaltiesApplied: 0,
      defaulted: 0,
      reminders: 0,
      errors: 0
    };

    for (const loan of loans) {
      try {
        // Calculate and apply penalties if in grace period
        const dueDate = new Date(loan.dueDate);
        const gracePeriodEnd = new Date(loan.gracePeriodEnd);

        if (now > dueDate && now <= gracePeriodEnd) {
          const newPenalties = calculatePenalty(loan);
          if (newPenalties > parseFloat(loan.penalties || 0)) {
            await loan.update({
              penalties: newPenalties,
              lastPenaltyDate: now
            });
            results.penaltiesApplied++;
            console.log(`Applied penalty to loan ${loan.id}: KSH ${newPenalties.toFixed(2)}`);
          }
        }

        // Update loan status
        const { newStatus, statusChanged } = await updateLoanStatus(loan);

        if (statusChanged) {
          await loan.update({ status: newStatus });
          results.updated++;
          console.log(`Loan ${loan.id} status changed to: ${newStatus}`);

          // Send default notification if loan just became defaulted
          if (newStatus === 'defaulted') {
            results.defaulted++;
            console.log(`Loan ${loan.id} DEFAULTED - sending notifications...`);
            await sendDefaultNotification(loan, loan.borrower);

            // Update borrower's defaulted loan count
            if (loan.borrower) {
              await loan.borrower.update({
                loansDefaulted: (loan.borrower.loansDefaulted || 0) + 1
              });
              console.log(`Updated borrower ${loan.borrower.id} defaulted count to ${loan.borrower.loansDefaulted + 1}`);
            }
          }
        }

        // Check if due date reminder should be sent (1 day before due date)
        const oneDayBeforeDue = new Date(dueDate);
        oneDayBeforeDue.setDate(oneDayBeforeDue.getDate() - 1);

        const isReminderDay = now.toDateString() === oneDayBeforeDue.toDateString();
        const isStillOutstanding = parseFloat(loan.amountRepaid || 0) < parseFloat(loan.totalAmount);

        if (isReminderDay && isStillOutstanding && loan.status !== 'paid') {
          console.log(`Sending due date reminder for loan ${loan.id}...`);
          await sendDueDateReminder(loan, loan.borrower);
          results.reminders++;
        }

      } catch (loanError) {
        console.error(`Error processing loan ${loan.id}:`, loanError.message);
        results.errors++;
      }
    }

    console.log('Loan processing complete:', results);
    return results;

  } catch (error) {
    console.error('Error in processAllLoans:', error);
    throw error;
  }
};

/**
 * Process a single loan (useful for testing or manual triggers)
 */
const processSingleLoan = async (loanId) => {
  try {
    const loan = await Loan.findByPk(loanId, {
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Collateral, as: 'collateral' }
      ]
    });

    if (!loan) {
      throw new Error('Loan not found');
    }

    const now = new Date();
    const dueDate = new Date(loan.dueDate);
    const gracePeriodEnd = new Date(loan.gracePeriodEnd);

    // Apply penalties if applicable
    if (now > dueDate && now <= gracePeriodEnd) {
      const newPenalties = calculatePenalty(loan);
      if (newPenalties > parseFloat(loan.penalties || 0)) {
        await loan.update({
          penalties: newPenalties,
          lastPenaltyDate: now
        });
      }
    }

    // Update status
    const { newStatus, statusChanged } = await updateLoanStatus(loan);
    if (statusChanged) {
      await loan.update({ status: newStatus });

      // Send notification if defaulted
      if (newStatus === 'defaulted') {
        await sendDefaultNotification(loan, loan.borrower);
      }
    }

    // Reload loan with updated data
    await loan.reload();
    return loan;

  } catch (error) {
    console.error(`Error processing loan ${loanId}:`, error);
    throw error;
  }
};

/**
 * Get loans that need reminders today (1 day before due date)
 */
const getLoansNeedingReminders = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const loans = await Loan.findAll({
    where: {
      status: { [Op.notIn]: ['paid', 'defaulted'] },
      dueDate: {
        [Op.gte]: tomorrow,
        [Op.lt]: dayAfterTomorrow
      }
    },
    include: [
      { model: Borrower, as: 'borrower' },
      { model: Collateral, as: 'collateral' }
    ]
  });

  return loans;
};

module.exports = {
  calculatePenalty,
  updateLoanStatus,
  processAllLoans,
  processSingleLoan,
  getLoansNeedingReminders,
  GRACE_PERIOD_DAYS,
  DAILY_PENALTY_RATE
};
