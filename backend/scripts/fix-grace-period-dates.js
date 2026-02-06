require('dotenv').config();
const sequelize = require('../config/database');
const Loan = require('../models/Loan');

/**
 * Migration Script: Fix Grace Period End Dates
 *
 * Updates all existing loans to have the correct grace period end date.
 * Old logic: gracePeriodEnd = dueDate + 7 days
 * New logic: gracePeriodEnd = dueDate + 8 days (so loan defaults AFTER 7-day grace period)
 */

async function fixGracePeriodDates() {
  try {
    console.log('🔧 Starting grace period date migration...\n');

    // Get all loans that are not paid or closed
    const loans = await Loan.findAll({
      where: {
        status: ['active', 'due', 'pastDue', 'defaulted']
      }
    });

    console.log(`Found ${loans.length} loans to update\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const loan of loans) {
      try {
        const dueDate = new Date(loan.dueDate);
        const currentGracePeriodEnd = new Date(loan.gracePeriodEnd);

        // Calculate what the grace period end SHOULD be (dueDate + 8 days)
        const correctGracePeriodEnd = new Date(dueDate);
        correctGracePeriodEnd.setDate(correctGracePeriodEnd.getDate() + 8);

        // Check if it needs updating
        const currentTime = currentGracePeriodEnd.getTime();
        const correctTime = correctGracePeriodEnd.getTime();

        if (currentTime !== correctTime) {
          await loan.update({
            gracePeriodEnd: correctGracePeriodEnd
          });

          updatedCount++;
          console.log(`✅ Loan #${loan.id}:`);
          console.log(`   Old: ${currentGracePeriodEnd.toISOString()}`);
          console.log(`   New: ${correctGracePeriodEnd.toISOString()}`);
        } else {
          skippedCount++;
          console.log(`⏭️  Loan #${loan.id}: Already correct, skipping`);
        }

      } catch (loanError) {
        errorCount++;
        console.error(`❌ Error updating loan #${loan.id}:`, loanError.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total loans processed: ${loans.length}`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped (already correct): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

    if (updatedCount > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('All existing loans now have the correct grace period end dates.');
      console.log('Loans will default AFTER the 7-day grace period (on day 8).\n');
    } else {
      console.log('\n✅ No updates needed - all loans already have correct dates.\n');
    }

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
}

fixGracePeriodDates();
