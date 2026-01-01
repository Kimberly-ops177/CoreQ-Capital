require('dotenv').config();
const sequelize = require('./config/database');
const User = require('./models/User');
const Borrower = require('./models/Borrower');
const Loan = require('./models/Loan');
const Collateral = require('./models/Collateral');
const Payment = require('./models/Payment');
const Expense = require('./models/Expense');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

const resetDatabase2026 = async () => {
  try {
    console.log('\n=== STARTING DATABASE RESET FOR 2026 ===\n');

    // Step 1: Connect to database
    console.log('Connecting to MySQL database...');
    await sequelize.authenticate();
    console.log('✓ Database connected successfully\n');

    // Step 2: Clean up orphaned PDF files
    console.log('Cleaning up PDF files...');
    const agreementsDir = path.join(__dirname, 'uploads', 'agreements');
    const signedAgreementsDir = path.join(__dirname, 'uploads', 'signed_agreements');

    try {
      const agreementFiles = await fs.readdir(agreementsDir);
      for (const file of agreementFiles) {
        if (file.endsWith('.pdf')) {
          await fs.unlink(path.join(agreementsDir, file));
        }
      }
      console.log(`✓ Deleted ${agreementFiles.filter(f => f.endsWith('.pdf')).length} files from agreements folder`);
    } catch (err) {
      console.log('  No agreements folder or already empty');
    }

    try {
      const signedFiles = await fs.readdir(signedAgreementsDir);
      for (const file of signedFiles) {
        if (file.endsWith('.pdf')) {
          await fs.unlink(path.join(signedAgreementsDir, file));
        }
      }
      console.log(`✓ Deleted ${signedFiles.filter(f => f.endsWith('.pdf')).length} files from signed_agreements folder\n`);
    } catch (err) {
      console.log('  No signed_agreements folder or already empty\n');
    }

    // Step 3: Disable foreign key checks
    console.log('Disabling foreign key checks...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✓ Foreign key checks disabled\n');

    // Step 4: Truncate data tables (in correct order due to dependencies)
    console.log('Clearing transactional data...');

    const paymentsCount = await Payment.count();
    await sequelize.query('TRUNCATE TABLE payments');
    console.log(`✓ Cleared ${paymentsCount} payments`);

    const expensesCount = await Expense.count();
    await sequelize.query('TRUNCATE TABLE expenses');
    console.log(`✓ Cleared ${expensesCount} expenses`);

    const loansCount = await Loan.count();
    await sequelize.query('TRUNCATE TABLE loans');
    console.log(`✓ Cleared ${loansCount} loans`);

    const collateralsCount = await Collateral.count();
    await sequelize.query('TRUNCATE TABLE collaterals');
    console.log(`✓ Cleared ${collateralsCount} collaterals`);

    const borrowersCount = await Borrower.count();
    await sequelize.query('TRUNCATE TABLE borrowers');
    console.log(`✓ Cleared ${borrowersCount} borrowers\n`);

    // Step 5: Reset users table and recreate admin + Kimberly
    console.log('Resetting users...');
    const usersCount = await User.count();
    await sequelize.query('TRUNCATE TABLE users');
    console.log(`✓ Cleared ${usersCount} old users`);

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 8);
    await User.create({
      name: 'Administrator',
      username: 'admin',
      email: 'admin@coreqcapital.com',
      password: adminPassword,
      role: 'admin',
      isActive: true
    });
    console.log('✓ Created admin user (admin@coreqcapital.com / admin123)');

    // Create Kimberly employee user
    const kimberlyPassword = await bcrypt.hash('kimberly123', 8);
    await User.create({
      name: 'Kimberly Wanjiku',
      username: 'kimberly',
      email: 'kimberlywanjiku28@gmail.com',
      password: kimberlyPassword,
      role: 'employee',
      assignedLocation: 'JUJA,HIGHPOINT',
      isActive: true
    });
    console.log('✓ Created employee user Kimberly (kimberlywanjiku28@gmail.com / kimberly123)');
    console.log('  Assigned locations: JUJA, HIGHPOINT\n');

    // Step 6: Reset auto-increment counters
    console.log('Resetting auto-increment counters...');
    await sequelize.query('ALTER TABLE borrowers AUTO_INCREMENT = 1');
    await sequelize.query('ALTER TABLE loans AUTO_INCREMENT = 1');
    await sequelize.query('ALTER TABLE collaterals AUTO_INCREMENT = 1');
    await sequelize.query('ALTER TABLE payments AUTO_INCREMENT = 1');
    await sequelize.query('ALTER TABLE expenses AUTO_INCREMENT = 1');
    await sequelize.query('ALTER TABLE users AUTO_INCREMENT = 1');
    console.log('✓ All auto-increment counters reset to 1\n');

    // Step 7: Re-enable foreign key checks
    console.log('Re-enabling foreign key checks...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Foreign key checks re-enabled\n');

    // Step 8: Summary
    console.log('=== RESET COMPLETE ===\n');
    console.log('Summary of changes:');
    console.log(`  - Deleted ${paymentsCount} payments`);
    console.log(`  - Deleted ${expensesCount} expenses`);
    console.log(`  - Deleted ${loansCount} loans`);
    console.log(`  - Deleted ${collateralsCount} collaterals`);
    console.log(`  - Deleted ${borrowersCount} borrowers`);
    console.log(`  - Recreated 2 users (admin + Kimberly)`);
    console.log('  - Cleaned up all PDF files');
    console.log('  - Reset all ID counters to start from 1');
    console.log('\nDatabase structure: INTACT ✓');
    console.log('MySQL connection: UNCHANGED ✓');
    console.log('All tables: PRESERVED ✓');
    console.log('\nThe system is now ready for 2026 operations!\n');

  } catch (error) {
    console.error('\n❌ ERROR during database reset:', error);
    console.error('\nThe database may be in an inconsistent state.');
    console.error('You may need to restore from a backup or manually fix issues.\n');
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

resetDatabase2026();
