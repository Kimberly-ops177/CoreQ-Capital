// Fix Kimberly's loan to use correct 32% interest rate for 3 weeks
require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixLoan() {
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

    // Get Kimberly's loan
    const [loans] = await connection.query(`
      SELECT l.*, b.fullName
      FROM loans l
      JOIN borrowers b ON l.borrowerId = b.id
      WHERE b.fullName LIKE '%Kimberly%'
      ORDER BY l.id DESC
      LIMIT 1
    `);

    if (loans.length === 0) {
      console.log('No loan found for Kimberly');
      return;
    }

    const loan = loans[0];
    console.log('Found loan:');
    console.log(`  Borrower: ${loan.fullName}`);
    console.log(`  Amount Issued: KSH ${parseFloat(loan.amountIssued).toLocaleString()}`);
    console.log(`  Period: ${loan.loanPeriod} week(s)`);
    console.log(`  Current Interest Rate: ${loan.interestRate}%`);
    console.log(`  Current Total Amount: KSH ${parseFloat(loan.totalAmount).toLocaleString()}\n`);

    // Calculate correct values for 3 weeks = 32%
    const correctInterestRate = 32;
    const principal = parseFloat(loan.amountIssued);
    const interestAmount = principal * (correctInterestRate / 100);
    const correctTotalAmount = principal + interestAmount;

    console.log('Updating to correct values:');
    console.log(`  Correct Interest Rate: ${correctInterestRate}%`);
    console.log(`  Interest Amount: KSH ${interestAmount.toLocaleString()}`);
    console.log(`  Correct Total Amount: KSH ${correctTotalAmount.toLocaleString()}\n`);

    // Update the loan
    await connection.query(
      'UPDATE loans SET interestRate = ?, totalAmount = ? WHERE id = ?',
      [correctInterestRate, correctTotalAmount, loan.id]
    );

    console.log('✅ Loan updated successfully!');
    console.log('\nOutstanding Receivables should now show KSH 5,544');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixLoan();
