// Auto-clean test data - runs once on deployment
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function autoCleanTestData() {
  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('Skipping test data cleanup in non-production environment');
    return;
  }

  // Check if cleanup has already been done
  const flagFile = path.join(__dirname, '.cleanup-done');
  if (fs.existsSync(flagFile)) {
    console.log('✓ Test data already cleaned');
    return;
  }

  let connection;
  try {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

    if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
      console.log('Database credentials not found, skipping cleanup');
      return;
    }

    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT || 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });

    console.log('🔄 Cleaning test data from production database...');

    // Delete in correct order to respect foreign key constraints
    await connection.query('DELETE FROM payments');
    await connection.query('DELETE FROM loans');
    await connection.query('DELETE FROM collaterals');
    await connection.query('DELETE FROM borrowers');
    await connection.query('DELETE FROM expenses');
    await connection.query("DELETE FROM users WHERE role != 'admin' OR email != 'admin@coreqcapital.com'");
    await connection.query('DELETE FROM branch_capital');
    await connection.query('DELETE FROM user_branch_access');
    await connection.query('DELETE FROM branches');
    await connection.query('DELETE FROM custom_fields');

    console.log('✓ Test data cleaned successfully');

    // Create flag file so we don't run this again
    fs.writeFileSync(flagFile, new Date().toISOString());
    console.log('✓ Cleanup completed - will not run again');

  } catch (error) {
    console.error('Cleanup error:', error.message);
    // Don't fail the deployment if cleanup fails
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

autoCleanTestData();
