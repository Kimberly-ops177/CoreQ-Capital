/**
 * Database Migration Script for Railway
 *
 * This script runs all pending migrations on the production database.
 *
 * Usage:
 *   railway run node backend/migrate.js
 *
 * Or locally:
 *   node backend/migrate.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.blue}═══ ${msg} ═══${colors.reset}\n`)
};

async function getDatabaseConnection() {
  const config = {
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'coreq_loans',
    multipleStatements: true
  };

  log.info(`Connecting to database: ${config.host}/${config.database}`);

  try {
    const connection = await mysql.createConnection(config);
    log.success('Database connection established');
    return connection;
  } catch (error) {
    log.error(`Failed to connect to database: ${error.message}`);
    throw error;
  }
}

async function checkColumnExists(connection, tableName, columnName) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) as count FROM information_schema.columns
     WHERE table_schema = DATABASE()
     AND table_name = ?
     AND column_name = ?`,
    [tableName, columnName]
  );
  return rows[0].count > 0;
}

async function runMigration1_AddLoanId(connection) {
  log.section('Migration 1: Add Loan ID Field');

  try {
    // Check if loanId column already exists
    const exists = await checkColumnExists(connection, 'loans', 'loanId');

    if (exists) {
      log.warning('loanId column already exists, skipping migration 1');
      return;
    }

    log.info('Adding loanId column to loans table...');
    await connection.query('ALTER TABLE loans ADD COLUMN loanId VARCHAR(50) UNIQUE AFTER id');
    log.success('Added loanId column');

    log.info('Creating index on loanId...');
    await connection.query('CREATE INDEX idx_loans_loanId ON loans(loanId)');
    log.success('Created index idx_loans_loanId');

    // Generate loan IDs for existing loans
    log.info('Generating loan IDs for existing loans...');
    const [result] = await connection.query(`
      UPDATE loans
      SET loanId = CONCAT('CQC-', YEAR(dateIssued), '-', LPAD(id, 4, '0'))
      WHERE loanId IS NULL
    `);
    log.success(`Generated loan IDs for ${result.affectedRows} existing loans`);

    log.success('Migration 1 completed successfully');
  } catch (error) {
    log.error(`Migration 1 failed: ${error.message}`);
    throw error;
  }
}

async function runMigration2_UpdateExpenseCategories(connection) {
  log.section('Migration 2: Update Expense Categories');

  try {
    // Check current expense categories
    log.info('Checking existing expense categories...');
    const [categories] = await connection.query('SELECT DISTINCT category FROM expenses');
    const existingCategories = categories.map(row => row.category);

    if (existingCategories.length > 0) {
      log.info(`Found categories: ${existingCategories.join(', ')}`);
    } else {
      log.info('No existing expenses found');
    }

    // Update non-standard categories to 'Others'
    const validCategories = ['Rent', 'Salary', 'Printing', 'Others'];
    const invalidCategories = existingCategories.filter(cat => !validCategories.includes(cat));

    if (invalidCategories.length > 0) {
      log.warning(`Found invalid categories: ${invalidCategories.join(', ')}`);
      log.info('Updating invalid categories to "Others"...');

      const [result] = await connection.query(`
        UPDATE expenses SET category = 'Others'
        WHERE category NOT IN ('Rent', 'Salary', 'Printing', 'Others')
      `);

      log.success(`Updated ${result.affectedRows} expenses to "Others" category`);
    }

    // Modify column to ENUM
    log.info('Converting category column to ENUM...');
    await connection.query(`
      ALTER TABLE expenses
      MODIFY COLUMN category ENUM('Rent', 'Salary', 'Printing', 'Others') NOT NULL
    `);
    log.success('Category column converted to ENUM');

    log.success('Migration 2 completed successfully');
  } catch (error) {
    log.error(`Migration 2 failed: ${error.message}`);
    throw error;
  }
}

async function runMigration3_UpdateLoanAgreementStatus(connection) {
  log.section('Migration 3: Update Loan Agreement Status');

  try {
    // Update existing loans from pending_upload to pending_approval
    log.info('Updating existing loans with pending_upload status...');
    const [result] = await connection.query(`
      UPDATE loans
      SET agreementStatus = 'pending_approval'
      WHERE agreementStatus = 'pending_upload'
    `);
    log.success(`Updated ${result.affectedRows} loans to pending_approval status`);

    // Modify the default value for agreementStatus
    log.info('Updating agreementStatus default value...');
    await connection.query(`
      ALTER TABLE loans
      MODIFY COLUMN agreementStatus
      ENUM('pending_upload', 'pending_approval', 'approved', 'rejected')
      DEFAULT 'pending_approval'
    `);
    log.success('Updated agreementStatus default to "pending_approval"');

    log.success('Migration 3 completed successfully');
  } catch (error) {
    log.error(`Migration 3 failed: ${error.message}`);
    throw error;
  }
}

async function verifyMigrations(connection) {
  log.section('Verifying Migrations');

  try {
    // Verify loanId column
    const loanIdExists = await checkColumnExists(connection, 'loans', 'loanId');
    if (loanIdExists) {
      log.success('✓ loanId column exists');

      // Count loans with IDs
      const [loanCount] = await connection.query(`
        SELECT
          COUNT(*) as total_loans,
          COUNT(loanId) as loans_with_id,
          COUNT(*) - COUNT(loanId) as loans_without_id
        FROM loans
      `);
      log.info(`  Total loans: ${loanCount[0].total_loans}`);
      log.info(`  With loan ID: ${loanCount[0].loans_with_id}`);
      log.info(`  Without loan ID: ${loanCount[0].loans_without_id}`);
    } else {
      log.error('✗ loanId column does not exist');
    }

    // Verify expense category ENUM
    const [categoryColumn] = await connection.query(`
      SHOW COLUMNS FROM expenses LIKE 'category'
    `);
    if (categoryColumn.length > 0) {
      const type = categoryColumn[0].Type;
      if (type.includes('enum')) {
        log.success('✓ Expense category is ENUM');
        log.info(`  Values: ${type}`);
      } else {
        log.error('✗ Expense category is not ENUM');
      }
    }

    // Verify loan agreement status default
    const [statusColumn] = await connection.query(`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_name = 'loans' AND column_name = 'agreementStatus'
    `);
    if (statusColumn.length > 0) {
      const defaultValue = statusColumn[0].column_default;
      if (defaultValue === 'pending_approval') {
        log.success('✓ agreementStatus default is "pending_approval"');
      } else {
        log.warning(`⚠ agreementStatus default is "${defaultValue}"`);
      }
    }

    log.success('Verification completed');
  } catch (error) {
    log.error(`Verification failed: ${error.message}`);
    throw error;
  }
}

async function runAllMigrations() {
  let connection;

  try {
    log.section('Starting Database Migrations');
    log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    log.info(`Timestamp: ${new Date().toISOString()}`);

    // Connect to database
    connection = await getDatabaseConnection();

    // Run migrations in order
    await runMigration1_AddLoanId(connection);
    await runMigration2_UpdateExpenseCategories(connection);
    await runMigration3_UpdateLoanAgreementStatus(connection);

    // Verify all migrations
    await verifyMigrations(connection);

    log.section('All Migrations Completed Successfully! 🎉');
    log.info('Your database is now up to date with all new features.');
    log.info('You can now deploy the updated backend code.');

  } catch (error) {
    log.section('Migration Failed ❌');
    log.error('An error occurred during migration:');
    log.error(error.message);
    log.error('\nPlease fix the error and try again.');
    log.error('If you need to rollback, see RAILWAY_DEPLOYMENT_GUIDE.md');
    process.exit(1);
  } finally {
    // Close connection
    if (connection) {
      await connection.end();
      log.info('Database connection closed');
    }
  }
}

// Run migrations
runAllMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
