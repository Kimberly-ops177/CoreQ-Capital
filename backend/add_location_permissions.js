const mysql = require('mysql2/promise');

async function addLocationPermissions() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'coreq_loans'
  });

  try {
    console.log('Adding location-based permissions to users table...\n');

    // Check if assignedLocation column exists
    const [locationCol] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'coreq_loans'
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'assignedLocation'
    `);

    if (locationCol.length > 0) {
      console.log('assignedLocation column already exists');
    } else {
      // Add assignedLocation column
      await connection.execute(`
        ALTER TABLE users
        ADD COLUMN assignedLocation VARCHAR(255) NULL AFTER role
      `);
      console.log('✓ Added assignedLocation column');
    }

    // Update permissions JSON structure to include location access
    await connection.execute(`
      UPDATE users
      SET permissions = JSON_SET(
        COALESCE(permissions, '{}'),
        '$.canAddExpense', COALESCE(JSON_EXTRACT(permissions, '$.canAddExpense'), false),
        '$.canViewAllLocations', CASE WHEN role = 'admin' THEN true ELSE false END,
        '$.canEditAllLocations', CASE WHEN role = 'admin' THEN true ELSE false END
      )
    `);
    console.log('✓ Updated permissions structure');

    // Show current users
    const [users] = await connection.execute(`
      SELECT id, name, email, role, assignedLocation, permissions
      FROM users
    `);

    console.log('\nCurrent users:');
    users.forEach(user => {
      console.log(`  ${user.name} (${user.role})`);
      console.log(`    Location: ${user.assignedLocation || 'All locations'}`);
      console.log(`    Permissions: ${user.permissions}`);
    });

    console.log('\n✓ Location-based permissions system added!');
    console.log('\nHow it works:');
    console.log('  - Admins: Can view and edit all locations');
    console.log('  - Employees: Can only view/edit borrowers from their assigned location');
    console.log('  - Set employee location: UPDATE users SET assignedLocation = \'Nairobi\' WHERE id = X');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

addLocationPermissions();
