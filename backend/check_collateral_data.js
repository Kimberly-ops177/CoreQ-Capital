const mysql = require('mysql2/promise');

async function checkCollateralData() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'coreq_loans'
  });

  try {
    // Check collaterals count
    const [count] = await conn.execute('SELECT COUNT(*) as total FROM collaterals');
    console.log(`Total collaterals: ${count[0].total}`);

    // Check sample with borrower data
    const [sample] = await conn.execute(`
      SELECT c.id, c.itemName, c.itemCondition, c.borrowerId, c.isSeized, b.fullName
      FROM collaterals c
      LEFT JOIN borrowers b ON c.borrowerId = b.id
      LIMIT 10
    `);

    console.log('\nSample collaterals:');
    sample.forEach(row => {
      console.log(`  ${row.id}: ${row.itemName} - ${row.fullName || 'No Borrower'} (Seized: ${row.isSeized})`);
    });

    // Check collaterals table structure
    const [columns] = await conn.execute('DESCRIBE collaterals');
    console.log('\nCollaterals table columns:');
    columns.forEach(col => console.log(`  ${col.Field} - ${col.Type}`));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await conn.end();
  }
}

checkCollateralData();
