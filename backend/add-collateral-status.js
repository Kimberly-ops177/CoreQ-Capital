require('dotenv').config();
const sequelize = require('./config/database');

const addCollateralStatusColumn = async () => {
  try {
    console.log('\n=== Adding status column to collaterals table ===\n');

    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    // Add status column
    await sequelize.query(`
      ALTER TABLE collaterals
      ADD COLUMN status ENUM('held', 'returned', 'seized', 'sold')
      DEFAULT 'held'
      AFTER itemCondition
    `);

    console.log('✓ Added status column to collaterals table');
    console.log('\nColumn details:');
    console.log('  - Type: ENUM(\'held\', \'returned\', \'seized\', \'sold\')');
    console.log('  - Default: \'held\'');
    console.log('  - held = with lender');
    console.log('  - returned = loan repaid successfully');
    console.log('  - seized = loan defaulted');
    console.log('  - sold = sold after seizure\n');

    console.log('=== Migration Complete ===\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nIf column already exists, this is safe to ignore.\n');
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

addCollateralStatusColumn();
