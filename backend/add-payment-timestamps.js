require('dotenv').config();
const sequelize = require('./config/database');

const addPaymentTimestamps = async () => {
  try {
    console.log('\n=== Adding timestamp columns to payments table ===\n');

    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    // Check if columns exist first
    const [columns] = await sequelize.query(`
      SHOW COLUMNS FROM payments LIKE 'createdAt'
    `);

    if (columns.length === 0) {
      // Add createdAt column
      await sequelize.query(`
        ALTER TABLE payments
        ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        AFTER processedBy
      `);
      console.log('✓ Added createdAt column to payments table');
    } else {
      console.log('  createdAt column already exists');
    }

    const [updatedColumns] = await sequelize.query(`
      SHOW COLUMNS FROM payments LIKE 'updatedAt'
    `);

    if (updatedColumns.length === 0) {
      // Add updatedAt column
      await sequelize.query(`
        ALTER TABLE payments
        ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        AFTER createdAt
      `);
      console.log('✓ Added updatedAt column to payments table');
    } else {
      console.log('  updatedAt column already exists');
    }

    console.log('\n=== Migration Complete ===\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

addPaymentTimestamps();
