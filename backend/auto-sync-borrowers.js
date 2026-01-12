/**
 * Auto-sync borrowers table on startup (production-safe)
 * Adds missing columns without affecting existing data
 */

const sequelize = require('./config/database');

async function autoSyncBorrowers() {
  // Only run in production (when DATABASE_URL or MYSQLHOST is set)
  const isProduction = process.env.DATABASE_URL || process.env.MYSQLHOST;

  if (!isProduction) {
    console.log('Skipping borrowers table sync in non-production environment');
    return;
  }

  try {
    console.log('Checking borrowers table schema...');

    // Check if columns exist
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
      return;
    }

    console.log(`Adding missing columns: ${missingColumns.join(', ')}`);

    // Add missing columns
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

    console.log('✅ Borrowers table schema updated successfully');
  } catch (error) {
    console.error('⚠️ Error syncing borrowers table:', error.message);
    // Don't throw - let server continue starting
  }
}

// Run the sync
autoSyncBorrowers();
