/**
 * Migration: Add loan history tracking fields to borrowers table
 * Run this with: node backend/migrations/add-borrower-loan-history.js
 */

// Load environment variables first
require('dotenv').config();

const sequelize = require('../config/database');

async function columnExists(tableName, columnName) {
  const [results] = await sequelize.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = '${tableName}'
      AND COLUMN_NAME = '${columnName}'
  `);
  return results.length > 0;
}

async function migrate() {
  try {
    console.log('Starting migration: Adding loan history fields to borrowers table...');

    // Add totalLoans column
    if (!(await columnExists('borrowers', 'totalLoans'))) {
      await sequelize.query(`
        ALTER TABLE borrowers
        ADD COLUMN totalLoans INT DEFAULT 0
        COMMENT 'Total number of loans taken by this borrower'
      `);
      console.log('✓ Added totalLoans column');
    } else {
      console.log('⊘ totalLoans column already exists');
    }

    // Add loansRepaid column
    if (!(await columnExists('borrowers', 'loansRepaid'))) {
      await sequelize.query(`
        ALTER TABLE borrowers
        ADD COLUMN loansRepaid INT DEFAULT 0
        COMMENT 'Number of loans successfully repaid'
      `);
      console.log('✓ Added loansRepaid column');
    } else {
      console.log('⊘ loansRepaid column already exists');
    }

    // Add loansDefaulted column
    if (!(await columnExists('borrowers', 'loansDefaulted'))) {
      await sequelize.query(`
        ALTER TABLE borrowers
        ADD COLUMN loansDefaulted INT DEFAULT 0
        COMMENT 'Number of loans that defaulted'
      `);
      console.log('✓ Added loansDefaulted column');
    } else {
      console.log('⊘ loansDefaulted column already exists');
    }

    // Add lastLoanDate column
    if (!(await columnExists('borrowers', 'lastLoanDate'))) {
      await sequelize.query(`
        ALTER TABLE borrowers
        ADD COLUMN lastLoanDate DATETIME NULL
        COMMENT 'Date of most recent loan'
      `);
      console.log('✓ Added lastLoanDate column');
    } else {
      console.log('⊘ lastLoanDate column already exists');
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
