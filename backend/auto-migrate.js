// Auto-migration script that runs on Railway deployment
const mysql = require('mysql2/promise');

async function runMigration() {
  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('Skipping auto-migration in non-production environment');
    return;
  }

  let connection;
  try {
    // Get Railway MySQL connection from config
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

    if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
      console.log('Database credentials not found, skipping migration');
      return;
    }

    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT || 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      multipleStatements: true
    });

    console.log('🔄 Running database migration...');

    // Check if 'closed' status already exists
    const [columns] = await connection.query("SHOW COLUMNS FROM loans LIKE 'status'");

    if (columns.length > 0) {
      const enumValues = columns[0].Type;

      if (enumValues.includes('closed')) {
        console.log('✓ Migration already applied - "closed" status exists');
        return;
      }
    }

    // Run migration
    const sql = `
      ALTER TABLE loans
      MODIFY COLUMN status ENUM('active', 'due', 'pastDue', 'paid', 'defaulted', 'closed')
      DEFAULT 'active';
    `;

    await connection.query(sql);
    console.log('✓ Migration completed - Added "closed" status to loans table');

  } catch (error) {
    console.error('Migration error:', error.message);
    // Don't fail the deployment if migration fails
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration
runMigration();
