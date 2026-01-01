const mysql = require('mysql2/promise');

async function addPaymentTracking() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'coreq_loans'
  });

  try {
    console.log('Adding payment tracking to loans table...\n');

    // Check if column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'coreq_loans'
      AND TABLE_NAME = 'loans'
      AND COLUMN_NAME = 'amountRepaid'
    `);

    if (columns.length > 0) {
      console.log('amountRepaid column already exists');
    } else {
      // Add amountRepaid column
      await connection.execute(`
        ALTER TABLE loans
        ADD COLUMN amountRepaid DECIMAL(10,2) DEFAULT 0 AFTER totalAmount
      `);
      console.log('✓ Added amountRepaid column');

      // Initialize all existing loans with amountRepaid = 0
      await connection.execute(`
        UPDATE loans
        SET amountRepaid = 0
        WHERE amountRepaid IS NULL
      `);
      console.log('✓ Initialized amountRepaid to 0 for all existing loans');
    }

    // Also add a lastPaymentDate column for tracking
    const [paymentDateCol] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'coreq_loans'
      AND TABLE_NAME = 'loans'
      AND COLUMN_NAME = 'lastPaymentDate'
    `);

    if (paymentDateCol.length > 0) {
      console.log('lastPaymentDate column already exists');
    } else {
      await connection.execute(`
        ALTER TABLE loans
        ADD COLUMN lastPaymentDate DATETIME NULL AFTER amountRepaid
      `);
      console.log('✓ Added lastPaymentDate column');
    }

    // Show updated table structure
    const [structure] = await connection.execute('DESCRIBE loans');
    console.log('\nUpdated loans table structure:');
    structure.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
    });

    console.log('\n✓ Payment tracking system added successfully!');
    console.log('\nYou can now:');
    console.log('  - Track partial payments with amountRepaid');
    console.log('  - Mark loans as paid when amountRepaid >= totalAmount');
    console.log('  - View payment history with lastPaymentDate');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

addPaymentTracking();
