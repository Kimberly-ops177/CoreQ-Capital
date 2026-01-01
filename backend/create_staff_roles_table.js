const mysql = require('mysql2/promise');

async function createStaffRolesTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'coreq_loans'
  });

  try {
    console.log('Creating staff_roles table...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS staff_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        roleName VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        permissions JSON NOT NULL,
        isSystemRole BOOLEAN DEFAULT false,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ staff_roles table created');

    // Insert default system roles
    await connection.execute(`
      INSERT INTO staff_roles (roleName, description, permissions, isSystemRole) VALUES
      ('Branch Manager', 'Full access to assigned branch operations',
        JSON_OBJECT(
          'canViewBorrowers', true,
          'canAddBorrowers', true,
          'canEditBorrowers', true,
          'canDeleteBorrowers', true,
          'canViewLoans', true,
          'canAddLoans', true,
          'canEditLoans', true,
          'canDeleteLoans', true,
          'canViewCollaterals', true,
          'canAddCollaterals', true,
          'canEditCollaterals', true,
          'canDeleteCollaterals', true,
          'canViewExpenses', true,
          'canAddExpenses', true,
          'canEditExpenses', true,
          'canDeleteExpenses', false,
          'canViewReports', true,
          'canApproveTransactions', true,
          'canViewSettings', false,
          'canEditSettings', false,
          'canViewUsers', false,
          'canAddUsers', false,
          'canEditUsers', false,
          'canDeleteUsers', false
        ),
        true
      ),
      ('Loan Officer', 'Manage loans and borrowers',
        JSON_OBJECT(
          'canViewBorrowers', true,
          'canAddBorrowers', true,
          'canEditBorrowers', true,
          'canDeleteBorrowers', false,
          'canViewLoans', true,
          'canAddLoans', true,
          'canEditLoans', true,
          'canDeleteLoans', false,
          'canViewCollaterals', true,
          'canAddCollaterals', true,
          'canEditCollaterals', true,
          'canDeleteCollaterals', false,
          'canViewExpenses', false,
          'canAddExpenses', false,
          'canEditExpenses', false,
          'canDeleteExpenses', false,
          'canViewReports', true,
          'canApproveTransactions', false,
          'canViewSettings', false,
          'canEditSettings', false,
          'canViewUsers', false,
          'canAddUsers', false,
          'canEditUsers', false,
          'canDeleteUsers', false
        ),
        true
      ),
      ('Accountant', 'Manage expenses and financial reports',
        JSON_OBJECT(
          'canViewBorrowers', true,
          'canAddBorrowers', false,
          'canEditBorrowers', false,
          'canDeleteBorrowers', false,
          'canViewLoans', true,
          'canAddLoans', false,
          'canEditLoans', false,
          'canDeleteLoans', false,
          'canViewCollaterals', true,
          'canAddCollaterals', false,
          'canEditCollaterals', false,
          'canDeleteCollaterals', false,
          'canViewExpenses', true,
          'canAddExpenses', true,
          'canEditExpenses', true,
          'canDeleteExpenses', false,
          'canViewReports', true,
          'canApproveTransactions', false,
          'canViewSettings', false,
          'canEditSettings', false,
          'canViewUsers', false,
          'canAddUsers', false,
          'canEditUsers', false,
          'canDeleteUsers', false
        ),
        true
      ),
      ('Data Entry Clerk', 'Basic data entry for borrowers and collaterals',
        JSON_OBJECT(
          'canViewBorrowers', true,
          'canAddBorrowers', true,
          'canEditBorrowers', true,
          'canDeleteBorrowers', false,
          'canViewLoans', true,
          'canAddLoans', false,
          'canEditLoans', false,
          'canDeleteLoans', false,
          'canViewCollaterals', true,
          'canAddCollaterals', true,
          'canEditCollaterals', true,
          'canDeleteCollaterals', false,
          'canViewExpenses', false,
          'canAddExpenses', false,
          'canEditExpenses', false,
          'canDeleteExpenses', false,
          'canViewReports', false,
          'canApproveTransactions', false,
          'canViewSettings', false,
          'canEditSettings', false,
          'canViewUsers', false,
          'canAddUsers', false,
          'canEditUsers', false,
          'canDeleteUsers', false
        ),
        true
      )
      ON DUPLICATE KEY UPDATE roleName=roleName
    `);
    console.log('✓ Default staff roles inserted');

    console.log('\n✓ Staff roles table created successfully!');
  } catch (error) {
    console.error('Error creating staff_roles table:', error.message);
  } finally {
    await connection.end();
  }
}

createStaffRolesTable();
