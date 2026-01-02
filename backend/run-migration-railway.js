const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;

  try {
    // Railway injects DATABASE_URL or individual MySQL variables
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      // Try individual variables
      const mysqlUrl = process.env.MYSQL_URL || process.env.MYSQLURL;
      if (!mysqlUrl) {
        throw new Error('DATABASE_URL or MYSQL_URL not found in environment variables');
      }
      process.env.DATABASE_URL = mysqlUrl;
    }

    console.log('Connecting to Railway MySQL database...');

    // Parse DATABASE_URL (format: mysql://user:password@host:port/database)
    const dbUrl = new URL(process.env.DATABASE_URL);

    connection = await mysql.createConnection({
      host: dbUrl.hostname,
      port: dbUrl.port || 3306,
      user: dbUrl.username,
      password: dbUrl.password,
      database: dbUrl.pathname.substring(1), // Remove leading slash
      multipleStatements: true
    });

    console.log('✓ Connected to database');

    // Read migration file
    const migrationFile = path.join(__dirname, 'migrations', 'add_closed_loan_status.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('\nRunning migration: add_closed_loan_status.sql');
    console.log('---');
    console.log(sql);
    console.log('---\n');

    // Execute migration
    await connection.query(sql);

    console.log('✓ Migration completed successfully!');
    console.log('✓ Added "closed" status to loans table');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nAvailable environment variables:');
    console.error('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    console.error('MYSQL_URL:', process.env.MYSQL_URL ? 'Set' : 'Not set');
    console.error('MYSQLURL:', process.env.MYSQLURL ? 'Set' : 'Not set');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
