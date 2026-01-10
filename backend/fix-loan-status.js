const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  logging: false
});

async function fixLoanStatus() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Connected to database');

    console.log('Updating loans with pending_upload to pending_approval...');
    const [results] = await sequelize.query(`
      UPDATE loans
      SET "agreementStatus" = 'pending_approval'
      WHERE "agreementStatus" = 'pending_upload'
      RETURNING id, "loanId", "agreementStatus";
    `);

    console.log(`✓ Updated ${results.length} loan(s):`);
    results.forEach(loan => {
      console.log(`  - Loan #${loan.id} (${loan.loanId || 'N/A'}): status updated to ${loan.agreementStatus}`);
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
