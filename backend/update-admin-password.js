const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function updateAdminPassword() {
  let connection;

  try {
    // Get database credentials from environment
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

    if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
      console.error('❌ Database credentials not found in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DB') || k.includes('MYSQL')));
      process.exit(1);
    }

    console.log('Connecting to database...');
    console.log('Host:', DB_HOST);
    console.log('Database:', DB_NAME);

    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT || 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });

    console.log('✓ Connected to database');

    // New password
    const newPassword = 'Admin@5432';
    console.log('\nGenerating password hash...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    console.log('Updating admin password...');
    const [result] = await connection.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, 'admin@coreqcapital.com']
    );

    if (result.affectedRows > 0) {
      console.log('\n✅ Admin password updated successfully!');
      console.log('\nNew Credentials:');
      console.log('  Email: admin@coreqcapital.com');
      console.log('  Password: Admin@5432');
    } else {
      console.log('\n⚠️  No admin user found with email: admin@coreqcapital.com');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateAdminPassword();
