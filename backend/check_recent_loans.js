const mysql = require('mysql2/promise');

async function checkRecentLoans() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'coreq_loans'
  });

  const [loans] = await conn.execute(`
    SELECT l.id, l.borrowerId, l.dueDate, l.status, l.amountIssued, b.fullName
    FROM loans l
    JOIN borrowers b ON l.borrowerId = b.id
    WHERE l.dueDate >= ?
    ORDER BY l.dueDate DESC
    LIMIT 10
  `, [new Date('2025-10-01')]);

  console.log('Recent loans (due Oct 2025+):\n');
  for (const loan of loans) {
    const [coll] = await conn.execute(
      'SELECT COUNT(*) as total, SUM(isSeized) as seized FROM collaterals WHERE borrowerId = ?',
      [loan.borrowerId]
    );
    console.log(`Loan #${loan.id} - ${loan.fullName}`);
    console.log(`  Due: ${loan.dueDate.toISOString().split('T')[0]}, Status: ${loan.status}`);
    console.log(`  Collaterals: ${coll[0].total}, Seized: ${coll[0].seized}`);
    console.log('');
  }

  await conn.end();
}

checkRecentLoans();
