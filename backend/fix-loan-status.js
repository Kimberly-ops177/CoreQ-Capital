const sequelize = require('./config/database');

async function fixLoanStatus() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Connected to database');

    console.log('Updating loans with pending_upload to pending_approval...');
    await sequelize.query(`
      UPDATE loans
      SET agreementStatus = 'pending_approval'
      WHERE agreementStatus = 'pending_upload'
    `);

    // Get updated loans
    const [results] = await sequelize.query(`
      SELECT id, agreementStatus
      FROM loans
      WHERE agreementStatus = 'pending_approval'
    `);

    console.log(`✓ Updated loan(s) - now showing ${results.length} loan(s) with pending_approval:`);
    results.forEach(loan => {
      console.log(`  - Loan #${loan.id}: status is ${loan.agreementStatus}`);
    });

    await sequelize.close();
    console.log('✓ Database connection closed');
    console.log('\nMigration complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixLoanStatus();
