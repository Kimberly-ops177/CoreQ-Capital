/**
 * CRITICAL STARTUP MIGRATION
 * This runs EVERY TIME the server starts to ensure borrowers table has required columns
 * Safe to run multiple times - only adds missing columns
 */

const sequelize = require('./config/database');

async function ensureBorrowersColumns() {
  console.log('🔄 Checking borrowers table schema...');

  try {
    // Check which columns exist
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'borrowers'
        AND COLUMN_NAME IN ('totalLoans', 'loansRepaid', 'loansDefaulted', 'lastLoanDate')
    `);

    const existingColumns = columns.map(c => c.COLUMN_NAME);
    const requiredColumns = ['totalLoans', 'loansRepaid', 'loansDefaulted', 'lastLoanDate'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length === 0) {
      console.log('✓ All borrowers table columns exist');
      return true;
    }

    console.log(`⚠️ Missing columns detected: ${missingColumns.join(', ')}`);
    console.log('Adding missing columns now...');

    // Add missing columns one by one
    if (missingColumns.includes('totalLoans')) {
      await sequelize.query(`
        ALTER TABLE borrowers
        ADD COLUMN totalLoans INT DEFAULT 0
        COMMENT 'Total number of loans taken by this borrower'
      `);
      console.log('✓ Added totalLoans column');
    }

    if (missingColumns.includes('loansRepaid')) {
      await sequelize.query(`
        ALTER TABLE borrowers
        ADD COLUMN loansRepaid INT DEFAULT 0
        COMMENT 'Number of loans successfully repaid'
      `);
      console.log('✓ Added loansRepaid column');
    }

    if (missingColumns.includes('loansDefaulted')) {
      await sequelize.query(`
        ALTER TABLE borrowers
        ADD COLUMN loansDefaulted INT DEFAULT 0
        COMMENT 'Number of loans that defaulted'
      `);
      console.log('✓ Added loansDefaulted column');
    }

    if (missingColumns.includes('lastLoanDate')) {
      await sequelize.query(`
        ALTER TABLE borrowers
        ADD COLUMN lastLoanDate DATETIME NULL
        COMMENT 'Date of most recent loan'
      `);
      console.log('✓ Added lastLoanDate column');
    }

    console.log('✅ Borrowers table schema updated successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error updating borrowers table:', error.message);
    // Don't throw - let server continue starting
    return false;
  }
}

module.exports = { ensureBorrowersColumns };
