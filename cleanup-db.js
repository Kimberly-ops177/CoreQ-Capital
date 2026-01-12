const mysql = require('./backend/node_modules/mysql2/promise');

async function cleanDatabase() {
  let connection;

  try {
    console.log('Connecting to database...');

    connection = await mysql.createConnection({
      host: 'autorack.proxy.rlwy.net',
      port: 30691,
      user: 'root',
      password: 'emDYJGiPNxAVZVTXvMRgBSXrcGOAHmnU',
      database: 'railway',
      connectTimeout: 30000
    });

    console.log('Connected! Cleaning database...\n');

    // Delete in correct order to respect foreign keys
    console.log('Deleting payments...');
    const [payments] = await connection.query('DELETE FROM payments');
    console.log(`✓ Deleted ${payments.affectedRows} payment(s)`);

    console.log('Deleting loans...');
    const [loans] = await connection.query('DELETE FROM loans');
    console.log(`✓ Deleted ${loans.affectedRows} loan(s)`);

    console.log('Deleting collaterals...');
    const [collaterals] = await connection.query('DELETE FROM collaterals');
    console.log(`✓ Deleted ${collaterals.affectedRows} collateral(s)`);

    console.log('Deleting borrowers...');
    const [borrowers] = await connection.query('DELETE FROM borrowers');
    console.log(`✓ Deleted ${borrowers.affectedRows} borrower(s)`);

    console.log('Deleting expenses...');
    const [expenses] = await connection.query('DELETE FROM expenses');
    console.log(`✓ Deleted ${expenses.affectedRows} expense(s)`);

    console.log('\n✅ Database cleaned successfully!');
    console.log('\nCurrent counts:');

    const [borrowerCount] = await connection.query('SELECT COUNT(*) as count FROM borrowers');
    console.log(`Borrowers: ${borrowerCount[0].count}`);

    const [loanCount] = await connection.query('SELECT COUNT(*) as count FROM loans');
    console.log(`Loans: ${loanCount[0].count}`);

    const [paymentCount] = await connection.query('SELECT COUNT(*) as count FROM payments');
    console.log(`Payments: ${paymentCount[0].count}`);

    const [collateralCount] = await connection.query('SELECT COUNT(*) as count FROM collaterals');
    console.log(`Collaterals: ${collateralCount[0].count}`);

    const [expenseCount] = await connection.query('SELECT COUNT(*) as count FROM expenses');
    console.log(`Expenses: ${expenseCount[0].count}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

cleanDatabase();
