/**
 * Sync database schema with models
 * This will add any missing columns without dropping existing data
 */

require('dotenv').config();
const sequelize = require('./config/database');
const Borrower = require('./models/Borrower');
const Loan = require('./models/Loan');

async function syncDatabase() {
  try {
    console.log('Syncing database schema...');

    // Sync only the Borrower model with alter: true
    // This adds missing columns without dropping existing ones
    await Borrower.sync({ alter: true });
    console.log('✓ Borrower table synced');

    console.log('\n✅ Database schema synced successfully!');
    console.log('The following columns should now exist in borrowers table:');
    console.log('  - totalLoans');
    console.log('  - loansRepaid');
    console.log('  - loansDefaulted');
    console.log('  - lastLoanDate');
  } catch (error) {
    console.error('❌ Sync failed:', error);
    console.error('Continuing with server startup...');
  }
}

syncDatabase().then(() => {
  console.log('Database sync completed, continuing...');
}).catch(err => {
  console.error('Database sync error:', err);
});
