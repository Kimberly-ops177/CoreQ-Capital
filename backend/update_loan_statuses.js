require('dotenv').config();
const { Op } = require('sequelize');
const Loan = require('./models/Loan');
const Collateral = require('./models/Collateral');
const Settings = require('./models/Settings');

async function updateLoanStatuses() {
  try {
    console.log('Starting loan status update...\n');

    const now = new Date();
    let settings = await Settings.findOne();

    if (!settings) {
      console.log('No settings found, creating default settings...');
      settings = await Settings.create({
        interestRates: { 1: 20, 2: 28, 3: 32, 4: 35 },
        gracePeriod: 7,
        penaltyFee: 3
      });
    }

    const loans = await Loan.findAll({
      where: {
        status: { [Op.ne]: 'paid' }
      }
    });

    console.log(`Found ${loans.length} unpaid loans to check\n`);

    let updatedCount = 0;
    let defaultedCount = 0;
    let pastDueCount = 0;
    let dueCount = 0;
    let activeCount = 0;

    for (const loan of loans) {
      const oldStatus = loan.status;

      if (now >= new Date(loan.gracePeriodEnd)) {
        loan.status = 'defaulted';
        // Mark collateral as seized
        if (loan.collateralId) {
          await Collateral.update(
            { isSeized: true },
            { where: { id: loan.collateralId } }
          );
        }
        defaultedCount++;
      } else if (now >= new Date(loan.dueDate)) {
        loan.status = 'pastDue';
        // Apply penalty
        const daysPastDue = Math.floor((now - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24));
        const lastPenaltyDate = loan.lastPenaltyDate ? new Date(loan.lastPenaltyDate) : new Date(loan.dueDate);
        const lastPenaltyDays = Math.floor((now - lastPenaltyDate) / (1000 * 60 * 60 * 24));

        if (lastPenaltyDays > 0) {
          const penaltyAmount = (parseFloat(loan.totalAmount) * settings.penaltyFee / 100) * lastPenaltyDays;
          loan.penalties = parseFloat(loan.penalties || 0) + penaltyAmount;
          loan.lastPenaltyDate = now;
        }
        pastDueCount++;
      } else if (now.toDateString() === new Date(loan.dueDate).toDateString()) {
        loan.status = 'due';
        dueCount++;
      } else {
        loan.status = 'active';
        activeCount++;
      }

      if (oldStatus !== loan.status) {
        await loan.save();
        updatedCount++;
      }
    }

    console.log('Update Summary:');
    console.log(`  Active: ${activeCount}`);
    console.log(`  Due: ${dueCount}`);
    console.log(`  Past Due: ${pastDueCount}`);
    console.log(`  Defaulted: ${defaultedCount}`);
    console.log(`\nTotal loans updated: ${updatedCount}`);

    process.exit(0);
  } catch (e) {
    console.error('Error updating loan statuses:', e);
    process.exit(1);
  }
}

updateLoanStatuses();
