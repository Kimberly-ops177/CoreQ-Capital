/**
 * Database Reset Script for Client Handover
 * Run with: node backend/scripts/reset-database.js
 *
 * This will:
 * 1. Delete all business data (payments, loans, collaterals, borrowers, etc.)
 * 2. Reset auto-increment IDs to start from 1
 * 3. Keep user accounts and system configuration
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Sequelize } = require('sequelize');

// Use MYSQL_PUBLIC_URL if available (for running locally with Railway)
// Otherwise fall back to individual env vars
let sequelize;
if (process.env.MYSQL_PUBLIC_URL) {
  console.log('Using MYSQL_PUBLIC_URL for connection...');
  sequelize = new Sequelize(process.env.MYSQL_PUBLIC_URL, {
    logging: false,
    dialectOptions: {
      ssl: false
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || process.env.MYSQLDATABASE || 'railway',
    process.env.DB_USER || process.env.MYSQLUSER || 'root',
    process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    {
      host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
      port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
      dialect: 'mysql',
      logging: false
    }
  );
}

async function resetDatabase() {
  console.log('🔄 Starting database reset...\n');

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('🔓 Foreign key checks disabled');

    // Tables to reset (in order)
    const tablesToReset = [
      'payments',
      'loans',
      'collaterals',
      'borrowers',
      'expenses',
      'branch_capitals',
      'user_branch_access',
      'custom_fields'
    ];

    for (const table of tablesToReset) {
      try {
        await sequelize.query(`TRUNCATE TABLE ${table}`);
        console.log(`   ✓ Truncated: ${table}`);
      } catch (err) {
        if (err.message.includes("doesn't exist")) {
          console.log(`   - Skipped: ${table} (table doesn't exist)`);
        } else {
          console.log(`   ✗ Error with ${table}: ${err.message}`);
        }
      }
    }

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n🔒 Foreign key checks re-enabled');

    console.log('\n✅ Database reset complete!');
    console.log('   - All business data cleared');
    console.log('   - IDs will start from 1');
    console.log('   - User accounts preserved');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Check for --confirm flag to skip prompt
if (process.argv.includes('--confirm')) {
  console.log('\n⚠️  Running with --confirm flag, skipping prompt...\n');
  resetDatabase();
} else {
  // Confirmation prompt
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n⚠️  WARNING: This will DELETE all business data!');
  console.log('   - All borrowers');
  console.log('   - All loans');
  console.log('   - All payments');
  console.log('   - All collaterals');
  console.log('   - All expenses\n');

  rl.question('Type "RESET" to confirm: ', (answer) => {
    rl.close();
    if (answer === 'RESET') {
      resetDatabase();
    } else {
      console.log('\n❌ Reset cancelled.');
      process.exit(0);
    }
  });
}
