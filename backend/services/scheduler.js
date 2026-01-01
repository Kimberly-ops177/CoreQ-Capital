const cron = require('node-cron');
const { processAllLoans } = require('./loanStatusService');

/**
 * Initialize all scheduled jobs
 * Per instructions: System must automatically send reminders, apply penalties, and flag defaulted loans
 */
const initializeScheduler = () => {
  console.log('Initializing loan processing scheduler...');

  // Run loan status processing daily at midnight (00:00)
  // This will:
  // 1. Send due date reminders (1 day before due date)
  // 2. Apply 3% daily penalties during grace period
  // 3. Update loan statuses (active -> due -> pastDue -> defaulted)
  // 4. Send default notifications
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily loan status processing...');
    try {
      const results = await processAllLoans();
      console.log('Daily loan processing completed:', results);
    } catch (error) {
      console.error('Error in daily loan processing:', error);
    }
  }, {
    scheduled: true,
    timezone: "Africa/Nairobi" // Kenya timezone
  });

  // Also run at noon for additional checks (optional - for testing)
  cron.schedule('0 12 * * *', async () => {
    console.log('Running midday loan status check...');
    try {
      const results = await processAllLoans();
      console.log('Midday loan processing completed:', results);
    } catch (error) {
      console.error('Error in midday loan processing:', error);
    }
  }, {
    scheduled: true,
    timezone: "Africa/Nairobi"
  });

  console.log('Scheduler initialized successfully');
  console.log('- Daily loan processing: Midnight (00:00 EAT)');
  console.log('- Midday check: Noon (12:00 EAT)');

  // Run immediately on startup to process any pending updates
  console.log('Running initial loan processing...');
  processAllLoans()
    .then(results => {
      console.log('Initial loan processing completed:', results);
    })
    .catch(error => {
      console.error('Error in initial loan processing:', error);
    });
};

module.exports = { initializeScheduler };
