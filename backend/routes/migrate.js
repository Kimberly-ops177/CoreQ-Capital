/**
 * ONE-TIME MIGRATION ENDPOINT
 * This endpoint runs database migrations
 * DELETE THIS FILE AFTER RUNNING THE MIGRATION!
 */

const express = require('express');
const sequelize = require('../config/database');
const router = express.Router();

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

router.get('/run-borrower-history-migration', async (req, res) => {
  try {
    const results = [];

    // Add totalLoans column
    if (!(await columnExists('borrowers', 'totalLoans'))) {
      await sequelize.query(`
        ALTER TABLE borrowers
        ADD COLUMN totalLoans INT DEFAULT 0
        COMMENT 'Total number of loans taken by this borrower'
      `);
      results.push('✓ Added totalLoans column');
    } else {
      results.push('⊘ totalLoans column already exists');
    }

    // Add loansRepaid column
    if (!(await columnExists('borrowers', 'loansRepaid'))) {
      await sequelize.query(`
        ALTER TABLE borrowers
        ADD COLUMN loansRepaid INT DEFAULT 0
        COMMENT 'Number of loans successfully repaid'
      `);
      results.push('✓ Added loansRepaid column');
    } else {
      results.push('⊘ loansRepaid column already exists');
    }

    // Add loansDefaulted column
    if (!(await columnExists('borrowers', 'loansDefaulted'))) {
      await sequelize.query(`
        ALTER TABLE borrowers
        ADD COLUMN loansDefaulted INT DEFAULT 0
        COMMENT 'Number of loans that defaulted'
      `);
      results.push('✓ Added loansDefaulted column');
    } else {
      results.push('⊘ loansDefaulted column already exists');
    }

    // Add lastLoanDate column
    if (!(await columnExists('borrowers', 'lastLoanDate'))) {
      await sequelize.query(`
        ALTER TABLE borrowers
        ADD COLUMN lastLoanDate DATETIME NULL
        COMMENT 'Date of most recent loan'
      `);
      results.push('✓ Added lastLoanDate column');
    } else {
      results.push('⊘ lastLoanDate column already exists');
    }

    res.send({
      success: true,
      message: 'Migration completed!',
      results: results,
      warning: 'IMPORTANT: Delete backend/routes/migrate.js after running this!'
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
