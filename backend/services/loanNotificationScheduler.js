const cron = require('node-cron');
const { Op } = require('sequelize');
const Loan = require('../models/Loan');
const Borrower = require('../models/Borrower');
const {
  send3DaysBeforeReminder,
  sendOnDueDateReminder,
  send1WeekPastDueReminder
} = require('./notificationService');

/**
 * Check and send notifications for loans due in 3 days
 */
const check3DaysBeforeNotifications = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    console.log(`[Notification Scheduler] Checking for loans due in 3 days (${threeDaysFromNow.toDateString()})...`);

    // Find all active loans with approved agreements due in exactly 3 days
    const loans = await Loan.findAll({
      where: {
        dueDate: {
          [Op.between]: [threeDaysFromNow, threeDaysFromNow]
        },
        status: { [Op.in]: ['active', 'due'] },
        agreementStatus: 'approved'
      },
      include: [
        {
          model: Borrower,
          as: 'borrower',
          required: true
        }
      ]
    });

    console.log(`[Notification Scheduler] Found ${loans.length} loans due in 3 days`);

    for (const loan of loans) {
      console.log(`[Notification Scheduler] Sending 3-day reminder for loan #${loan.id} to ${loan.borrower.fullName}`);
      const result = await send3DaysBeforeReminder(loan, loan.borrower);
      console.log(`[Notification Scheduler] Result:`, result);
    }

    return { success: true, count: loans.length };
  } catch (error) {
    console.error('[Notification Scheduler] Error checking 3-day reminders:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check and send notifications for loans due today
 */
const checkDueDateNotifications = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    console.log(`[Notification Scheduler] Checking for loans due today (${today.toDateString()})...`);

    // Find all active loans with approved agreements due today
    const loans = await Loan.findAll({
      where: {
        dueDate: {
          [Op.between]: [today, endOfToday]
        },
        status: { [Op.in]: ['active', 'due'] },
        agreementStatus: 'approved'
      },
      include: [
        {
          model: Borrower,
          as: 'borrower',
          required: true
        }
      ]
    });

    console.log(`[Notification Scheduler] Found ${loans.length} loans due today`);

    for (const loan of loans) {
      console.log(`[Notification Scheduler] Sending due date reminder for loan #${loan.id} to ${loan.borrower.fullName}`);
      const result = await sendOnDueDateReminder(loan, loan.borrower);
      console.log(`[Notification Scheduler] Result:`, result);
    }

    return { success: true, count: loans.length };
  } catch (error) {
    console.error('[Notification Scheduler] Error checking due date reminders:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check and send notifications for loans 1 week past due
 */
const check1WeekPastDueNotifications = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const oneWeekAgoEnd = new Date(oneWeekAgo);
    oneWeekAgoEnd.setHours(23, 59, 59, 999);

    console.log(`[Notification Scheduler] Checking for loans 1 week past due (due on ${oneWeekAgo.toDateString()})...`);

    // Find all loans with approved agreements that are exactly 1 week overdue
    const loans = await Loan.findAll({
      where: {
        dueDate: {
          [Op.between]: [oneWeekAgo, oneWeekAgoEnd]
        },
        status: { [Op.in]: ['active', 'due', 'pastDue'] },
        agreementStatus: 'approved'
      },
      include: [
        {
          model: Borrower,
          as: 'borrower',
          required: true
        }
      ]
    });

    console.log(`[Notification Scheduler] Found ${loans.length} loans 1 week past due`);

    for (const loan of loans) {
      console.log(`[Notification Scheduler] Sending 1-week overdue reminder for loan #${loan.id} to ${loan.borrower.fullName}`);
      const result = await send1WeekPastDueReminder(loan, loan.borrower);
      console.log(`[Notification Scheduler] Result:`, result);
    }

    return { success: true, count: loans.length };
  } catch (error) {
    console.error('[Notification Scheduler] Error checking 1-week past due reminders:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Initialize the notification scheduler
 * Runs daily at 9:00 AM to check for notifications
 */
const initializeNotificationScheduler = () => {
  console.log('[Notification Scheduler] Initializing automated notification scheduler...');

  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[Notification Scheduler] Running daily notification check at 9:00 AM...');

    await check3DaysBeforeNotifications();
    await checkDueDateNotifications();
    await check1WeekPastDueNotifications();

    console.log('[Notification Scheduler] Daily notification check completed.');
  });

  console.log('[Notification Scheduler] Scheduler initialized. Will run daily at 9:00 AM.');

  // Optionally run a check immediately on startup (for testing)
  if (process.env.RUN_NOTIFICATIONS_ON_STARTUP === 'true') {
    console.log('[Notification Scheduler] Running immediate notification check on startup...');
    setTimeout(async () => {
      await check3DaysBeforeNotifications();
      await checkDueDateNotifications();
      await check1WeekPastDueNotifications();
    }, 5000); // Wait 5 seconds after server starts
  }
};

module.exports = {
  initializeNotificationScheduler,
  check3DaysBeforeNotifications,
  checkDueDateNotifications,
  check1WeekPastDueNotifications
};
