// List all loans in the database
require('dotenv').config();
const mysql = require('mysql2/promise');

async function listLoans() {
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

    const [loans] = await connection.query(`
      SELECT l.id, b.fullName, l.amountIssued, l.loanPeriod, l.interestRate,
             l.totalAmount, l.amountRepaid, l.penalties, l.status
      FROM loans l
      JOIN borrowers b ON l.borrowerId = b.id
      ORDER BY l.id DESC
    `);

    console.log(`Found ${loans.length} loan(s):\n`);

    loans.forEach((loan, index) => {
      const principal = parseFloat(loan.amountIssued);
      const total = parseFloat(loan.totalAmount);
      const repaid = parseFloat(loan.amountRepaid || 0);
      const penalties = parseFloat(loan.penalties || 0);
      const outstanding = total + penalties - repaid;

      console.log(`${index + 1}. ${loan.fullName} (ID: ${loan.id})`);
      console.log(`   Amount: KSH ${principal.toLocaleString()}`);
      console.log(`   Period: ${loan.loanPeriod} week(s)`);
      console.log(`   Interest Rate: ${loan.interestRate}%`);
      console.log(`   Total Amount: KSH ${total.toLocaleString()}`);
      console.log(`   Amount Repaid: KSH ${repaid.toLocaleString()}`);
      console.log(`   Penalties: KSH ${penalties.toLocaleString()}`);
      console.log(`   Outstanding: KSH ${outstanding.toLocaleString()}`);
      console.log(`   Status: ${loan.status}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

listLoans();
