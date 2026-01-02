// Clean production database - Remove all test data
// Keeps only: admin user and system settings
const mysql = require('mysql2/promise');

async function cleanProductionDatabase() {
  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️  This script only runs in production environment');
    console.log('Set NODE_ENV=production to run');
    return;
  }

  let connection;
  try {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

    if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
      console.log('❌ Database credentials not found');
      return;
    }

    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT || 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });

    console.log('🔄 Starting database cleanup...\n');

    // Delete in correct order to respect foreign key constraints

    // 1. Delete payments first
    const [paymentsResult] = await connection.query('DELETE FROM payments');
    console.log(`✓ Deleted ${paymentsResult.affectedRows} payments`);

    // 2. Delete loans
    const [loansResult] = await connection.query('DELETE FROM loans');
    console.log(`✓ Deleted ${loansResult.affectedRows} loans`);

    // 3. Delete collaterals
    const [collateralsResult] = await connection.query('DELETE FROM collaterals');
    console.log(`✓ Deleted ${collateralsResult.affectedRows} collaterals`);

    // 4. Delete borrowers
    const [borrowersResult] = await connection.query('DELETE FROM borrowers');
    console.log(`✓ Deleted ${borrowersResult.affectedRows} borrowers`);

    // 5. Delete expenses
    const [expensesResult] = await connection.query('DELETE FROM expenses');
    console.log(`✓ Deleted ${expensesResult.affectedRows} expenses`);

    // 6. Delete non-admin users (keep admin)
    const [usersResult] = await connection.query(
      "DELETE FROM users WHERE role != 'admin' AND email != 'admin@coreqcapital.com'"
    );
    console.log(`✓ Deleted ${usersResult.affectedRows} non-admin users`);

    // 7. Delete branches and related data
    const [branchCapitalResult] = await connection.query('DELETE FROM branch_capital');
    console.log(`✓ Deleted ${branchCapitalResult.affectedRows} branch capital records`);

    const [userBranchResult] = await connection.query('DELETE FROM user_branch_access');
    console.log(`✓ Deleted ${userBranchResult.affectedRows} user-branch access records`);

    const [branchesResult] = await connection.query('DELETE FROM branches');
    console.log(`✓ Deleted ${branchesResult.affectedRows} branches`);

    // 8. Delete custom fields
    const [customFieldsResult] = await connection.query('DELETE FROM custom_fields');
    console.log(`✓ Deleted ${customFieldsResult.affectedRows} custom fields`);

    // Keep settings and staff_roles as they're system configuration

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('\nRemaining data:');
    console.log('  - Admin user (admin@coreqcapital.com)');
    console.log('  - System settings');
    console.log('  - Staff roles configuration');
    console.log('\nAll test data has been removed.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

cleanProductionDatabase();
