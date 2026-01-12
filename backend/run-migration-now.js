/**
 * ONE-TIME MIGRATION - Run this manually on Railway
 *
 * Instructions:
 * 1. In Railway, go to your backend service
 * 2. Click on the deployment
 * 3. Open the Shell/Terminal tab
 * 4. Run: node run-migration-now.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
  console.log('🔄 Starting migration...');

  try {
    // Create connection using Railway's MySQL credentials
    const connection = await mysql.createConnection({
      host: process.env.MYSQLHOST || process.env.DB_HOST,
      user: process.env.MYSQLUSER || process.env.DB_USER,
      password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
      database: process.env.MYSQLDATABASE || process.env.DB_NAME,
      port: process.env.MYSQLPORT || process.env.DB_PORT || 3306
    });

    console.log('✓ Connected to database');

    // Check which columns are missing
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'borrowers'
        AND COLUMN_NAME IN ('totalLoans', 'loansRepaid', 'loansDefaulted', 'lastLoanDate')
    `);

    const existingColumns = columns.map(c => c.COLUMN_NAME);
    console.log('Existing columns:', existingColumns);

    const requiredColumns = ['totalLoans', 'loansRepaid', 'loansDefaulted', 'lastLoanDate'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length === 0) {
      console.log('✅ All columns already exist!');
      await connection.end();
      process.exit(0);
    }

    console.log('Missing columns:', missingColumns);

    // Add missing columns
    if (missingColumns.includes('totalLoans')) {
      await connection.query(`
        ALTER TABLE borrowers
        ADD COLUMN totalLoans INT DEFAULT 0
        COMMENT 'Total number of loans taken by this borrower'
      `);
      console.log('✓ Added totalLoans');
    }

    if (missingColumns.includes('loansRepaid')) {
      await connection.query(`
        ALTER TABLE borrowers
        ADD COLUMN loansRepaid INT DEFAULT 0
        COMMENT 'Number of loans successfully repaid'
      `);
      console.log('✓ Added loansRepaid');
    }

    if (missingColumns.includes('loansDefaulted')) {
      await connection.query(`
        ALTER TABLE borrowers
        ADD COLUMN loansDefaulted INT DEFAULT 0
        COMMENT 'Number of loans that defaulted'
      `);
      console.log('✓ Added loansDefaulted');
    }

    if (missingColumns.includes('lastLoanDate')) {
      await connection.query(`
        ALTER TABLE borrowers
        ADD COLUMN lastLoanDate DATETIME NULL
        COMMENT 'Date of most recent loan'
      `);
      console.log('✓ Added lastLoanDate');
    }

    await connection.end();
    console.log('\n✅ Migration completed successfully!');
    console.log('You can now refresh your browser pages.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
