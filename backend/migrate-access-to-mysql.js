require('dotenv').config();
const mysql = require('mysql2/promise');
const odbc = require('odbc'); // You'll need to install this: npm install odbc
const fs = require('fs');
const path = require('path');

// Database configurations
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'coreqcapital',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Access database connection string
const accessConnectionString = process.env.ACCESS_DB_PATH ||
  'Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=C:\\path\\to\\your\\database.accdb;';

// Migration class
class AccessToMySQLMigrator {
  constructor() {
    this.mysqlConnection = null;
    this.accessConnection = null;
  }

  async connect() {
    try {
      // Connect to MySQL
      this.mysqlConnection = await mysql.createConnection(mysqlConfig);
      console.log('✅ Connected to MySQL database');

      // Connect to Access
      this.accessConnection = await odbc.connect(accessConnectionString);
      console.log('✅ Connected to Access database');

    } catch (error) {
      console.error('❌ Connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.mysqlConnection) {
      await this.mysqlConnection.end();
      console.log('✅ MySQL connection closed');
    }
    if (this.accessConnection) {
      await this.accessConnection.close();
      console.log('✅ Access connection closed');
    }
  }

  async logRowCounts(stage = '') {
    const tables = [
      { access: 'Users', mysql: 'Users' },
      { access: 'Borrowers', mysql: 'Borrowers' },
      { access: 'Collaterals', mysql: 'Collaterals' },
      { access: 'Loans', mysql: 'Loans' },
      { access: 'Payments', mysql: 'Loans' }, // payments stored as JSON array on Loans
      { access: 'Expenses', mysql: 'Expenses' },
      { access: 'Settings', mysql: 'Settings' }
    ];

    console.log(`\n📊 Row counts ${stage ? `[${stage}]` : ''}`);

    const getCountVal = (row) => {
      const raw = row?.count !== undefined
        ? row.count
        : row?.COUNT !== undefined
          ? row.COUNT
          : row
            ? Object.values(row)[0]
            : 0;
      const num = Number(raw);
      return Number.isFinite(num) ? num : 0;
    };

    for (const table of tables) {
      try {
        const accessCountRows = await this.accessConnection.query(`SELECT COUNT(*) AS count FROM ${table.access}`);
        const accessCount = getCountVal(accessCountRows?.[0]);

        const [mysqlCountRows] = await this.mysqlConnection.execute(`SELECT COUNT(*) AS count FROM ${table.mysql}`);
        const mysqlCount = getCountVal(mysqlCountRows?.[0]);

        console.log(`↔️  ${table.access.padEnd(11)} Access=${String(accessCount).padStart(5)} | MySQL=${String(mysqlCount).padStart(5)}`);
      } catch (error) {
        console.log(`⚠️  Could not fetch counts for ${table.access} -> ${table.mysql}:`, error.message || error);
      }
    }

    console.log('');
  }

  async migrateUsers() {
    console.log('📤 Migrating Users...');
    try {
      // Read from Access
      const accessUsers = await this.accessConnection.query(`
        SELECT UserID, Username, Password, Role, Permissions, IsActive, CreatedAt
        FROM Users
      `);

      if (accessUsers.length === 0) {
        console.log('⚠️  No users found in Access database');
        return;
      }

      // Insert into MySQL
      const insertQuery = `
        INSERT INTO Users (name, email, password, role, permissions, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        password = VALUES(password),
        role = VALUES(role),
        permissions = VALUES(permissions),
        isActive = VALUES(isActive),
        updatedAt = NOW()
      `;

      for (const user of accessUsers) {
        const permissions = user.Permissions ? JSON.parse(user.Permissions) : { canAddExpense: false };

        await this.mysqlConnection.execute(insertQuery, [
          user.Username || 'Unknown User',
          user.Username + '@coreqcapital.com', // Generate email if not exists
          user.Password,
          user.Role || 'employee',
          JSON.stringify(permissions),
          user.IsActive !== false,
          user.CreatedAt || new Date(),
          new Date()
        ]);
      }

      console.log(`✅ Migrated ${accessUsers.length} users`);
    } catch (error) {
      console.error('❌ Error migrating users:', error);
    }
  }

  async migrateBorrowers() {
    console.log('📤 Migrating Borrowers...');
    try {
      const accessBorrowers = await this.accessConnection.query(`
        SELECT BorrowerID, FullName, IDNumber, PhoneNumber, Email,
               Location, Apartment, HouseNumber, IsStudent, Institution, RegistrationNumber, CreatedAt
        FROM Borrowers
      `);

      if (accessBorrowers.length === 0) {
        console.log('⚠️  No borrowers found in Access database');
        return;
      }

      const insertQuery = `
        INSERT INTO Borrowers (fullName, idNumber, phoneNumber, email, location,
                              apartment, houseNumber, isStudent, institution, registrationNumber, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        fullName = VALUES(fullName),
        phoneNumber = VALUES(phoneNumber),
        email = VALUES(email),
        location = VALUES(location),
        apartment = VALUES(apartment),
        houseNumber = VALUES(houseNumber),
        isStudent = VALUES(isStudent),
        institution = VALUES(institution),
        registrationNumber = VALUES(registrationNumber),
        updatedAt = NOW()
      `;

      for (const borrower of accessBorrowers) {
        await this.mysqlConnection.execute(insertQuery, [
          borrower.FullName,
          borrower.IDNumber,
          borrower.PhoneNumber,
          borrower.Email,
          borrower.Location,
          borrower.Apartment || null,
          borrower.HouseNumber || null,
          borrower.IsStudent || false,
          borrower.Institution || null,
          borrower.RegistrationNumber || null,
          borrower.CreatedAt || new Date(),
          new Date()
        ]);
      }

      console.log(`✅ Migrated ${accessBorrowers.length} borrowers`);
    } catch (error) {
      console.error('❌ Error migrating borrowers:', error);
    }
  }

  async migrateCollaterals() {
    console.log('📤 Migrating Collaterals...');
    try {
      const accessCollaterals = await this.accessConnection.query(`
        SELECT CollateralID, BorrowerID, Category, ItemName, ModelNumber,
               SerialNumber, Condition, IsSeized, IsSold, SoldPrice, CreatedAt
        FROM Collaterals
      `);

      if (accessCollaterals.length === 0) {
        console.log('⚠️  No collaterals found in Access database');
        return;
      }

      const insertQuery = `
        INSERT INTO Collaterals (borrowerId, category, itemName, modelNumber,
                                serialNumber, condition, isSeized, isSold, soldPrice, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        category = VALUES(category),
        itemName = VALUES(itemName),
        modelNumber = VALUES(modelNumber),
        serialNumber = VALUES(serialNumber),
        condition = VALUES(condition),
        isSeized = VALUES(isSeized),
        isSold = VALUES(isSold),
        soldPrice = VALUES(soldPrice),
        updatedAt = NOW()
      `;

      for (const collateral of accessCollaterals) {
        // Get MySQL borrower ID
        const [borrowerRows] = await this.mysqlConnection.execute(
          'SELECT id FROM Borrowers WHERE idNumber = ?',
          [collateral.BorrowerID] // Assuming BorrowerID in Access is IDNumber
        );

        if (borrowerRows.length === 0) {
          console.log(`⚠️  Borrower not found for collateral ${collateral.CollateralID}, skipping`);
          continue;
        }

        const borrowerId = borrowerRows[0].id;

        await this.mysqlConnection.execute(insertQuery, [
          borrowerId,
          collateral.Category,
          collateral.ItemName,
          collateral.ModelNumber || null,
          collateral.SerialNumber || null,
          collateral.Condition,
          collateral.IsSeized || false,
          collateral.IsSold || false,
          collateral.SoldPrice || null,
          collateral.CreatedAt || new Date(),
          new Date()
        ]);
      }

      console.log(`✅ Migrated ${accessCollaterals.length} collaterals`);
    } catch (error) {
      console.error('❌ Error migrating collaterals:', error);
    }
  }

  async migrateLoans() {
    console.log('📤 Migrating Loans...');
    try {
      const accessLoans = await this.accessConnection.query(`
        SELECT LoanID, BorrowerID, CollateralID, AmountIssued, DateIssued,
               LoanPeriod, InterestRate, DueDate, Status, TotalAmount,
               Penalties, IsNegotiable, GracePeriodEnd, LastPenaltyDate, CreatedAt
        FROM Loans
      `);

      if (accessLoans.length === 0) {
        console.log('⚠️  No loans found in Access database');
        return;
      }

      const insertQuery = `
        INSERT INTO Loans (borrowerId, collateralId, amountIssued, dateIssued,
                          loanPeriod, interestRate, dueDate, status, totalAmount,
                          penalties, isNegotiable, gracePeriodEnd, lastPenaltyDate, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        amountIssued = VALUES(amountIssued),
        loanPeriod = VALUES(loanPeriod),
        interestRate = VALUES(interestRate),
        dueDate = VALUES(dueDate),
        status = VALUES(status),
        totalAmount = VALUES(totalAmount),
        penalties = VALUES(penalties),
        isNegotiable = VALUES(isNegotiable),
        gracePeriodEnd = VALUES(gracePeriodEnd),
        lastPenaltyDate = VALUES(lastPenaltyDate),
        updatedAt = NOW()
      `;

      for (const loan of accessLoans) {
        // Get MySQL IDs
        const [borrowerRows] = await this.mysqlConnection.execute(
          'SELECT id FROM Borrowers WHERE idNumber = ?',
          [loan.BorrowerID]
        );

        if (borrowerRows.length === 0) {
          console.log(`⚠️  Borrower not found for loan ${loan.LoanID}, skipping`);
          continue;
        }

        const borrowerId = borrowerRows[0].id;

        let collateralId = null;
        if (loan.CollateralID) {
          const [collateralRows] = await this.mysqlConnection.execute(
            'SELECT id FROM Collaterals WHERE borrowerId = ? LIMIT 1',
            [borrowerId]
          );
          if (collateralRows.length > 0) {
            collateralId = collateralRows[0].id;
          }
        }

        await this.mysqlConnection.execute(insertQuery, [
          borrowerId,
          collateralId,
          loan.AmountIssued,
          loan.DateIssued || new Date(),
          loan.LoanPeriod,
          loan.InterestRate,
          loan.DueDate,
          loan.Status || 'active',
          loan.TotalAmount,
          loan.Penalties || 0,
          loan.IsNegotiable || false,
          loan.GracePeriodEnd || null,
          loan.LastPenaltyDate || null,
          loan.CreatedAt || new Date(),
          new Date()
        ]);
      }

      console.log(`✅ Migrated ${accessLoans.length} loans`);
    } catch (error) {
      console.error('❌ Error migrating loans:', error);
    }
  }

  async migratePayments() {
    console.log('📤 Migrating Payments...');
    try {
      const accessPayments = await this.accessConnection.query(`
        SELECT PaymentID, LoanID, Amount, Date, Note
        FROM Payments
      `);

      if (accessPayments.length === 0) {
        console.log('⚠️  No payments found in Access database');
        return;
      }

      for (const payment of accessPayments) {
        // Get MySQL loan ID
        const [loanRows] = await this.mysqlConnection.execute(
          'SELECT id FROM Loans WHERE borrowerId IN (SELECT id FROM Borrowers WHERE idNumber = ?) LIMIT 1',
          [payment.LoanID] // Assuming LoanID in Access references borrower
        );

        if (loanRows.length === 0) {
          console.log(`⚠️  Loan not found for payment ${payment.PaymentID}, skipping`);
          continue;
        }

        const loanId = loanRows[0].id;

        // Insert payment as JSON in the payments field
        const paymentData = {
          amount: payment.Amount,
          date: payment.Date || new Date(),
          note: payment.Note || ''
        };

        await this.mysqlConnection.execute(
          'UPDATE Loans SET payments = JSON_ARRAY_APPEND(COALESCE(payments, JSON_ARRAY()), "$", ?) WHERE id = ?',
          [JSON.stringify(paymentData), loanId]
        );
      }

      console.log(`✅ Migrated ${accessPayments.length} payments`);
    } catch (error) {
      console.error('❌ Error migrating payments:', error);
    }
  }

  async migrateExpenses() {
    console.log('📤 Migrating Expenses...');
    try {
      const accessExpenses = await this.accessConnection.query(`
        SELECT ExpenseID, Category, Name, Date, Amount, AddedBy, CreatedAt
        FROM Expenses
      `);

      if (accessExpenses.length === 0) {
        console.log('⚠️  No expenses found in Access database');
        return;
      }

      const insertQuery = `
        INSERT INTO Expenses (category, name, date, amount, addedBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        category = VALUES(category),
        name = VALUES(name),
        date = VALUES(date),
        amount = VALUES(amount),
        updatedAt = NOW()
      `;

      for (const expense of accessExpenses) {
        // Get MySQL user ID
        let userId = null;
        if (expense.AddedBy) {
          const [userRows] = await this.mysqlConnection.execute(
            'SELECT id FROM Users WHERE name = ? OR email = ? LIMIT 1',
            [expense.AddedBy, expense.AddedBy + '@coreqcapital.com']
          );
          if (userRows.length > 0) {
            userId = userRows[0].id;
          }
        }

        await this.mysqlConnection.execute(insertQuery, [
          expense.Category,
          expense.Name,
          expense.Date || new Date(),
          expense.Amount,
          userId || 1, // Default to first user if not found
          expense.CreatedAt || new Date(),
          new Date()
        ]);
      }

      console.log(`✅ Migrated ${accessExpenses.length} expenses`);
    } catch (error) {
      console.error('❌ Error migrating expenses:', error);
    }
  }

  async migrateSettings() {
    console.log('📤 Migrating Settings...');
    try {
      const accessSettings = await this.accessConnection.query(`
        SELECT SettingID, InterestRates, PenaltyFee, GracePeriod, LoanThreshold,
               NegotiableThreshold, UpdatedAt
        FROM Settings
      `);

      if (accessSettings.length === 0) {
        console.log('⚠️  No settings found in Access database, using defaults');
        return;
      }

      const setting = accessSettings[0];

      const insertQuery = `
        INSERT INTO Settings (interestRates, penaltyFee, gracePeriod, loanThreshold,
                             negotiableThreshold, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        interestRates = VALUES(interestRates),
        penaltyFee = VALUES(penaltyFee),
        gracePeriod = VALUES(gracePeriod),
        loanThreshold = VALUES(loanThreshold),
        negotiableThreshold = VALUES(negotiableThreshold),
        updatedAt = NOW()
      `;

      const interestRates = setting.InterestRates ?
        JSON.parse(setting.InterestRates) :
        { 1: 20, 2: 28, 3: 32, 4: 35 };

      await this.mysqlConnection.execute(insertQuery, [
        JSON.stringify(interestRates),
        setting.PenaltyFee || 3,
        setting.GracePeriod || 7,
        setting.LoanThreshold || 12000,
        setting.NegotiableThreshold || 50000,
        setting.UpdatedAt || new Date()
      ]);

      console.log('✅ Migrated settings');
    } catch (error) {
      console.error('❌ Error migrating settings:', error);
    }
  }

  async runMigration() {
    console.log('🚀 Starting Access to MySQL Migration...');
    console.log('=====================================');

    try {
      await this.connect();

      await this.logRowCounts('before');

      // Run migrations in order (important for foreign keys)
      await this.migrateUsers();
      await this.migrateBorrowers();
      await this.migrateCollaterals();
      await this.migrateLoans();
      await this.migratePayments();
      await this.migrateExpenses();
      await this.migrateSettings();

      await this.logRowCounts('after');

      console.log('=====================================');
      console.log('🎉 Migration completed successfully!');

    } catch (error) {
      console.error('💥 Migration failed:', error);
    } finally {
      await this.disconnect();
    }
  }

  // Utility method to check Access table structure
  async checkAccessTables() {
    try {
      await this.connect();
      console.log('📋 Checking Access database structure...');

      const tables = await this.accessConnection.query(`
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'TABLE'
      `);

      console.log('Available tables:', tables.map(t => t.TABLE_NAME));

      for (const table of tables) {
        try {
          const columns = await this.accessConnection.query(`
            SELECT COLUMN_NAME, DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = '${table.TABLE_NAME}'
            ORDER BY ORDINAL_POSITION
          `);
          console.log(`\n${table.TABLE_NAME} columns:`, columns);
        } catch (err) {
          console.log(`Could not get columns for ${table.TABLE_NAME}`);
        }
      }

    } catch (error) {
      console.error('Error checking Access structure:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const migrator = new AccessToMySQLMigrator();

  if (args.includes('--check')) {
    await migrator.checkAccessTables();
  } else if (args.includes('--migrate')) {
    await migrator.runMigration();
  } else {
    console.log('Usage:');
    console.log('  node migrate-access-to-mysql.js --check    # Check Access database structure');
    console.log('  node migrate-access-to-mysql.js --migrate  # Run full migration');
    console.log('');
    console.log('Environment variables:');
    console.log('  ACCESS_DB_PATH - Path to Access database file');
    console.log('  DB_HOST, DB_USER, DB_PASSWORD, DB_NAME - MySQL connection details');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AccessToMySQLMigrator;
