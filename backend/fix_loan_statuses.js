const mysql = require('mysql2/promise');

async function fixLoanStatuses() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'coreq_loans'
  });

  try {
    console.log('Fixing loan statuses...\n');

    // Get all loans
    const [loans] = await connection.execute('SELECT id, borrowerId, dueDate, status FROM loans');
    console.log(`Total loans: ${loans.length}`);

    // Get borrowers who have seized collaterals
    const [seizedCollaterals] = await connection.execute(`
      SELECT DISTINCT borrowerId
      FROM collaterals
      WHERE isSeized = 1
    `);
    const borrowersWithSeizedCollaterals = new Set(seizedCollaterals.map(c => c.borrowerId));
    console.log(`Borrowers with seized collaterals: ${borrowersWithSeizedCollaterals.size}`);

    const now = new Date();
    const gracePeriod = 7; // days

    let activeCount = 0;
    let defaultedCount = 0;
    let paidCount = 0;

    for (const loan of loans) {
      let newStatus = loan.status;

      // If borrower has seized collateral, loan is defaulted
      if (borrowersWithSeizedCollaterals.has(loan.borrowerId)) {
        newStatus = 'defaulted';
        defaultedCount++;
      } else {
        // Check due date
        const dueDate = new Date(loan.dueDate);
        const gracePeriodEnd = new Date(dueDate);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriod);

        if (now <= dueDate) {
          // Loan is still within due date - active
          newStatus = 'active';
          activeCount++;
        } else if (now <= gracePeriodEnd) {
          // Within grace period - still active but due
          newStatus = 'active';
          activeCount++;
        } else {
          // Past grace period - defaulted
          newStatus = 'defaulted';
          defaultedCount++;
        }
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
    `);
    console.log('\nFinal loan status counts:');
    finalCounts.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixLoanStatuses();
