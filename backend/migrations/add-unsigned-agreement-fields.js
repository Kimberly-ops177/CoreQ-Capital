/**
 * Migration script to add unsigned agreement fields to loans table
 * Run this once to add the new columns to the database
 */

const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('Starting migration: Adding unsigned agreement fields to loans table...');

    // Add unsignedAgreementPath column
    await sequelize.query(`
      ALTER TABLE loans
      ADD COLUMN IF NOT EXISTS unsignedAgreementPath VARCHAR(500) NULL
    `);
    console.log('✓ Added unsignedAgreementPath column');

    // Add unsignedAgreementFilename column
    await sequelize.query(`
      ALTER TABLE loans
      ADD COLUMN IF NOT EXISTS unsignedAgreementFilename VARCHAR(255) NULL
    `);
    console.log('✓ Added unsignedAgreementFilename column');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
