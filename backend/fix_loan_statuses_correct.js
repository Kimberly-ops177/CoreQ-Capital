const mysql = require('mysql2/promise');

async function fixLoanStatuses() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'coreq_loans'
  });

  try {
    console.log('Fixing loan statuses based on due dates...\n');

    // Get all loans
    const [loans] = await connection.execute('SELECT id, dueDate, status FROM loans');
    console.log(`Total loans: ${loans.length}`);

    const now = new Date();
    const gracePeriod = 7; // days

    let activeCount = 0;
    let defaultedCount = 0;
    let paidCount = 0;

    for (const loan of loans) {
      let newStatus;

      // Skip if already paid
      if (loan.status === 'paid') {
        paidCount++;
        continue;
      }

      // Check due date
      const dueDate = new Date(loan.dueDate);
      const gracePeriodEnd = new Date(dueDate);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriod);

      if (now <= gracePeriodEnd) {
        // Loan is still within due date + grace period - active
        newStatus = 'active';
        activeCount++;
      } else {
        // Past grace period - defaulted
        newStatus = 'defaulted';
        defaultedCount++;
      }

      // Update if status changed
      if (newStatus !== loan.status) {
        await connection.execute(
          'UPDATE loans SET status = ? WHERE id = ?',
          [newStatus, loan.id]
        );
      }
    }

    console.log(`\nStatus update complete:`);
    console.log(`  Active loans: ${activeCount}`);
    console.log(`  Defaulted loans: ${defaultedCount}`);
    console.log(`  Paid loans: ${paidCount}`);

    // Verify final counts
    const [finalCounts] = await connection.execute(`
      SELECT status, COUNT(*) as count
      FROM loans
      GROUP BY status
      ORDER BY status
    `);
    console.log('\nFinal loan status counts:');
    finalCounts.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });

    // Show some examples of active loans
    const [activeLoans] = await connection.execute(`
      SELECT id, dueDate, status
      FROM loans
      WHERE status = 'active'
      ORDER BY dueDate DESC
      LIMIT 5
    `);
    if (activeLoans.length > 0) {
      console.log('\nSample active loans:');
      activeLoans.forEach(loan => {
        console.log(`  Loan #${loan.id} - Due: ${loan.dueDate.toISOString().split('T')[0]}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixLoanStatuses();
