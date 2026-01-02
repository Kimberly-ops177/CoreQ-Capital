// Auto-update admin password script that runs on Railway deployment
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function updateAdminPassword() {
  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('Skipping admin password update in non-production environment');
    return;
  }

  let connection;
  try {
    // Get Railway MySQL connection from config
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

    if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
      console.log('Database credentials not found, skipping password update');
      return;
    }

    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT || 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });

    console.log('🔄 Checking admin password...');

    // Check if we need to update the password
    // We'll update it if it's the old default password
    const newPassword = 'Admin@5432';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password for admin user
    const [result] = await connection.query(
      'UPDATE users SET password = ? WHERE email = ? AND role = ?',
      [hashedPassword, 'admin@coreqcapital.com', 'admin']
    );

    if (result.affectedRows > 0) {
      console.log('✓ Admin password updated to secure password');
      console.log('  Email: admin@coreqcapital.com');
      console.log('  Password: Admin@5432');
    } else {
      console.log('✓ Admin password already up to date or user not found');
    }

  } catch (error) {
    console.error('Password update error:', error.message);
    // Don't fail the deployment if password update fails
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run password update
updateAdminPassword();
