// Fix all loans to use correct interest rates
require('dotenv').config();
const mysql = require('mysql2/promise');

// Correct interest rates
const RATES = {
  1: 20,   // 1 Week: 20%
  2: 28,   // 2 Weeks: 28%
  3: 32,   // 3 Weeks: 32%
  4: 35    // 4 Weeks: 35%
};

async function fixAllLoans() {
  let connection;
  try {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT || 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });

    console.log('✓ Connected to database\n');

    // Get all non-negotiable loans
    const [loans] = await connection.query(`
      SELECT l.id, b.fullName, l.amountIssued, l.loanPeriod, l.interestRate,
             l.totalAmount, l.isNegotiable
      FROM loans l
      JOIN borrowers b ON l.borrowerId = b.id
      WHERE l.isNegotiable = FALSE OR l.isNegotiable IS NULL
    `);

    console.log(`Found ${loans.length} non-negotiable loan(s) to check:\n`);

    let updated = 0;

    for (const loan of loans) {
      const correctRate = RATES[loan.loanPeriod];
      const currentRate = parseFloat(loan.interestRate);
      const principal = parseFloat(loan.amountIssued);

      console.log(`${loan.fullName} (ID: ${loan.id})`);
      console.log(`  Amount: KSH ${principal.toLocaleString()}`);
      console.log(`  Period: ${loan.loanPeriod} week(s)`);
      console.log(`  Current Rate: ${currentRate}%`);
      console.log(`  Correct Rate: ${correctRate}%`);

      if (Math.abs(currentRate - correctRate) > 0.01) {
        // Rate is incorrect, fix it
        const interestAmount = principal * (correctRate / 100);
        const correctTotal = principal + interestAmount;

        await connection.query(
          'UPDATE loans SET interestRate = ?, totalAmount = ? WHERE id = ?',
          [correctRate, correctTotal, loan.id]
        );

        console.log(`  ✅ UPDATED: Total changed from KSH ${parseFloat(loan.totalAmount).toLocaleString()} to KSH ${correctTotal.toLocaleString()}\n`);
        updated++;
      } else {
        console.log(`  ✓ Already correct\n`);
      }
    }

    console.log(`\n✅ Fixed ${updated} loan(s)`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixAllLoans();
