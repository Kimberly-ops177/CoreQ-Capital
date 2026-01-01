require('dotenv').config();
const sequelize = require('./config/database');

const addPaymentMethodColumn = async () => {
  try {
    console.log('\n=== Adding paymentMethod column to payments table ===\n');

    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    // Add paymentMethod column
    await sequelize.query(`
      ALTER TABLE payments
      ADD COLUMN paymentMethod VARCHAR(255) NULL
      AFTER paymentDate
    `);

    console.log('✓ Added paymentMethod column to payments table');
    console.log('\nColumn details:');
    console.log('  - Type: VARCHAR(255)');
    console.log('  - Nullable: Yes');
    console.log('  - Default: NULL\n');

    console.log('=== Migration Complete ===\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nIf column already exists, this is safe to ignore.\n');
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

addPaymentMethodColumn();
