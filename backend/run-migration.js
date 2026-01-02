const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'loanmanagement',
      multipleStatements: true
    });

    console.log('Connected to database');

    // Read migration file
    const migrationFile = path.join(__dirname, 'migrations', 'add_closed_loan_status.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('Running migration: add_closed_loan_status.sql');
    console.log(sql);

    // Execute migration
    await connection.query(sql);

    console.log('✓ Migration completed successfully!');
    console.log('✓ Added "closed" status to loans table');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
