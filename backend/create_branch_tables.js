const mysql = require('mysql2/promise');

async function createBranchTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'coreq_loans'
  });

  try {
    console.log('Creating branch management tables...');

    // Create branches table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS branches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branchName VARCHAR(255) NOT NULL UNIQUE,
        branchCode VARCHAR(50) NOT NULL UNIQUE,
        location VARCHAR(255),
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        managerName VARCHAR(255),
        minLoanAmount DECIMAL(10, 2) DEFAULT 1000,
        maxLoanAmount DECIMAL(10, 2) DEFAULT 100000,
        minInterestRate DECIMAL(5, 2) DEFAULT 5.00,
        maxInterestRate DECIMAL(5, 2) DEFAULT 30.00,
        isActive BOOLEAN DEFAULT true,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ branches table created');

    // Create branch_capital table for tracking capital
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS branch_capital (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branchId INT NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        capitalType ENUM('initial', 'addition', 'withdrawal') DEFAULT 'addition',
        description TEXT,
        addedBy INT,
        transactionDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE CASCADE,
        FOREIGN KEY (addedBy) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ branch_capital table created');

    // Create custom_fields table for branch-specific custom fields
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS custom_fields (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branchId INT,
        fieldName VARCHAR(255) NOT NULL,
        fieldLabel VARCHAR(255) NOT NULL,
        fieldType ENUM('text', 'number', 'date', 'select', 'checkbox', 'textarea') DEFAULT 'text',
        entityType ENUM('borrower', 'loan', 'collateral') NOT NULL,
        isRequired BOOLEAN DEFAULT false,
        options JSON,
        defaultValue VARCHAR(255),
        displayOrder INT DEFAULT 0,
        isActive BOOLEAN DEFAULT true,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ custom_fields table created');

    // Create user_branch_access table for multi-branch access
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_branch_access (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        branchId INT NOT NULL,
        canView BOOLEAN DEFAULT true,
        canEdit BOOLEAN DEFAULT false,
        canDelete BOOLEAN DEFAULT false,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_branch (userId, branchId)
      )
    `);
    console.log('✓ user_branch_access table created');

    // Insert default branch
    await connection.execute(`
      INSERT INTO branches (branchName, branchCode, location, minLoanAmount, maxLoanAmount, minInterestRate, maxInterestRate)
      VALUES ('Main Branch', 'MAIN', 'Headquarters', 1000, 100000, 5.00, 30.00)
      ON DUPLICATE KEY UPDATE branchName=branchName
    `);
    console.log('✓ Default branch inserted');

    // Add currentBranchId to users table
    await connection.execute(`
      ALTER TABLE users
      ADD COLUMN currentBranchId INT NULL AFTER branch,
      ADD FOREIGN KEY (currentBranchId) REFERENCES branches(id) ON DELETE SET NULL
    `);
    console.log('✓ Added currentBranchId to users table');

    // Add branchId to borrowers table
    await connection.execute(`
      ALTER TABLE borrowers
      ADD COLUMN branchId INT NULL AFTER location,
      ADD COLUMN customFields JSON NULL AFTER isStudent,
      ADD FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE SET NULL
    `);
    console.log('✓ Added branchId to borrowers table');

    // Add branchId to loans table
    await connection.execute(`
      ALTER TABLE loans
      ADD COLUMN branchId INT NULL AFTER gracePeriodEnd,
      ADD COLUMN customFields JSON NULL AFTER branchId,
      ADD FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE SET NULL
    `);
    console.log('✓ Added branchId to loans table');

    // Add branchId to collaterals table
    await connection.execute(`
      ALTER TABLE collaterals
      ADD COLUMN branchId INT NULL AFTER serialNumber,
      ADD COLUMN customFields JSON NULL AFTER branchId,
      ADD FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE SET NULL
    `);
    console.log('✓ Added branchId to collaterals table');

    console.log('\n✓ All branch management tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error.message);
    if (error.message.includes('Duplicate column name')) {
      console.log('Note: Some columns may already exist');
    }
  } finally {
    await connection.end();
  }
}

createBranchTables();
