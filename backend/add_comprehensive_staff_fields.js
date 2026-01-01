const mysql = require('mysql2/promise');

async function addComprehensiveStaffFields() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'coreq_loans'
  });

  try {
    console.log('Adding comprehensive staff management fields to users table...');

    // Add address field
    await connection.execute(`
      ALTER TABLE users
      ADD COLUMN address TEXT NULL AFTER assignedLocation
    `);
    console.log('✓ Added address field');

    // Add branch/location fields
    await connection.execute(`
      ALTER TABLE users
      ADD COLUMN branch VARCHAR(255) NULL AFTER address,
      ADD COLUMN canAccessAllBranches BOOLEAN DEFAULT false AFTER branch
    `);
    console.log('✓ Added branch fields');

    // Add login restriction fields
    await connection.execute(`
      ALTER TABLE users
      ADD COLUMN allowedWorkDays JSON NULL AFTER canAccessAllBranches,
      ADD COLUMN allowedIPAddresses JSON NULL AFTER allowedWorkDays,
      ADD COLUMN allowedCountries JSON NULL AFTER allowedIPAddresses
    `);
    console.log('✓ Added login restriction fields');

    // Add transaction restriction fields
    await connection.execute(`
      ALTER TABLE users
      ADD COLUMN canBackdate BOOLEAN DEFAULT false AFTER allowedCountries,
      ADD COLUMN canPostdate BOOLEAN DEFAULT false AFTER canBackdate,
      ADD COLUMN repaymentsRequireApproval BOOLEAN DEFAULT false AFTER canPostdate,
      ADD COLUMN savingsRequireApproval BOOLEAN DEFAULT false AFTER repaymentsRequireApproval
    `);
    console.log('✓ Added transaction restriction fields');

    // Add staff role field
    await connection.execute(`
      ALTER TABLE users
      ADD COLUMN staffRoleId INT NULL AFTER role,
      ADD FOREIGN KEY (staffRoleId) REFERENCES staff_roles(id) ON DELETE SET NULL
    `);
    console.log('✓ Added staffRoleId field');

    // Update permissions field to have more detailed structure
    await connection.execute(`
      UPDATE users
      SET permissions = JSON_SET(
        COALESCE(permissions, '{}'),
        '$.canAddExpense', COALESCE(JSON_EXTRACT(permissions, '$.canAddExpense'), false),
        '$.canViewAllLocations', CASE WHEN role = 'admin' THEN true ELSE false END,
        '$.canEditAllLocations', CASE WHEN role = 'admin' THEN true ELSE false END,
        '$.canViewBorrowers', true,
        '$.canAddBorrowers', true,
        '$.canEditBorrowers', true,
        '$.canDeleteBorrowers', CASE WHEN role = 'admin' THEN true ELSE false END,
        '$.canViewLoans', true,
        '$.canAddLoans', true,
        '$.canEditLoans', true,
        '$.canDeleteLoans', CASE WHEN role = 'admin' THEN true ELSE false END,
        '$.canViewCollaterals', true,
        '$.canAddCollaterals', true,
        '$.canEditCollaterals', true,
        '$.canDeleteCollaterals', CASE WHEN role = 'admin' THEN true ELSE false END,
        '$.canViewReports', true,
        '$.canViewSettings', CASE WHEN role = 'admin' THEN true ELSE false END,
        '$.canEditSettings', CASE WHEN role = 'admin' THEN true ELSE false END,
        '$.canViewUsers', CASE WHEN role = 'admin' THEN true ELSE false END,
        '$.canAddUsers', CASE WHEN role = 'admin' THEN true ELSE false END,
        '$.canEditUsers', CASE WHEN role = 'admin' THEN true ELSE false END,
        '$.canDeleteUsers', CASE WHEN role = 'admin' THEN true ELSE false END,
        '$.canApproveTransactions', CASE WHEN role = 'admin' THEN true ELSE false END
      )
    `);
    console.log('✓ Updated permissions structure');

    console.log('\n✓ All comprehensive staff fields added successfully!');
  } catch (error) {
    console.error('Error adding fields:', error.message);
    if (error.message.includes('Duplicate column name')) {
      console.log('Note: Some columns may already exist');
    }
  } finally {
    await connection.end();
  }
}

addComprehensiveStaffFields();
