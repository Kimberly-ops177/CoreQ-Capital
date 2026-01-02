/**
 * Migration script to add unsigned agreement fields to loans table
 * Run this once to add the new columns to the database
 */

const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('Starting migration: Adding unsigned agreement fields to loans table...');

    // Check if unsignedAgreementPath column exists
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'loans'
      AND COLUMN_NAME = 'unsignedAgreementPath'
    `);

    if (columns.length === 0) {
      // Add unsignedAgreementPath column
      await sequelize.query(`
        ALTER TABLE loans
        ADD COLUMN unsignedAgreementPath VARCHAR(500) NULL
      `);
      console.log('✓ Added unsignedAgreementPath column');

      // Add unsignedAgreementFilename column
      await sequelize.query(`
        ALTER TABLE loans
        ADD COLUMN unsignedAgreementFilename VARCHAR(255) NULL
      `);
      console.log('✓ Added unsignedAgreementFilename column');
    } else {
      console.log('✓ Columns already exist, skipping migration');
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
