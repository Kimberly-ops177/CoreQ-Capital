# Access to MySQL Migration Guide

This guide will help you migrate your existing Microsoft Access database to MySQL for the Core Q Capital Loan Management System.

## 📋 Prerequisites

### 1. Install ODBC Driver for Access
You need the Microsoft Access Database Engine installed on your system:

**For 64-bit systems:**
- Download and install: [Microsoft Access Database Engine 2016 Redistributable](https://www.microsoft.com/en-us/download/details.aspx?id=54920)

**For 32-bit systems:**
- Download and install: [Microsoft Access 2010 Database Engine Redistributable](https://www.microsoft.com/en-us/download/details.aspx?id=13255)

### 2. Access Database Location
Ensure your Access database file (`.accdb` or `.mdb`) is accessible and note its full path.

### 3. MySQL Database Setup
Make sure your MySQL database is running and the tables are created (they should be created automatically when you run the backend).

## ⚙️ Configuration

### Environment Variables

Create or update your `.env` file in the `backend` folder with the following variables:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=coreqcapital

# Access Database Path
ACCESS_DB_PATH=Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=C:\path\to\your\database.accdb;
```

**Example for Access database at `C:\Databases\loans.accdb`:**
```env
ACCESS_DB_PATH=Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=C:\Databases\loans.accdb;
```

## 🔍 Step 1: Check Access Database Structure

Before migrating, let's check what tables and columns exist in your Access database:

```bash
cd backend
npm run check-access
```

This will show you:
- Available tables in your Access database
- Column names and data types for each table

## 📊 Step 2: Understand Data Mapping

The migration script maps Access tables to MySQL tables as follows:

### Users Table
- **Access**: `Users` → **MySQL**: `Users`
- Maps: `UserID`, `Username`, `Password`, `Role`, `Permissions`, `IsActive`, `CreatedAt`

### Borrowers Table
- **Access**: `Borrowers` → **MySQL**: `Borrowers`
- Maps: `BorrowerID`, `FullName`, `IDNumber`, `PhoneNumber`, `Email`, `Location`, `Apartment`, `HouseNumber`, `IsStudent`, `Institution`, `RegistrationNumber`, `CreatedAt`

### Collaterals Table
- **Access**: `Collaterals` → **MySQL**: `Collaterals`
- Maps: `CollateralID`, `BorrowerID`, `Category`, `ItemName`, `ModelNumber`, `SerialNumber`, `Condition`, `IsSeized`, `IsSold`, `SoldPrice`, `CreatedAt`

### Loans Table
- **Access**: `Loans` → **MySQL**: `Loans`
- Maps: `LoanID`, `BorrowerID`, `CollateralID`, `AmountIssued`, `DateIssued`, `LoanPeriod`, `InterestRate`, `DueDate`, `Status`, `TotalAmount`, `Penalties`, `IsNegotiable`, `GracePeriodEnd`, `LastPenaltyDate`, `CreatedAt`

### Payments Table
- **Access**: `Payments` → **MySQL**: `Loans.payments` (JSON array)
- Maps: `PaymentID`, `LoanID`, `Amount`, `Date`, `Note`

### Expenses Table
- **Access**: `Expenses` → **MySQL**: `Expenses`
- Maps: `ExpenseID`, `Category`, `Name`, `Date`, `Amount`, `AddedBy`, `CreatedAt`

### Settings Table
- **Access**: `Settings` → **MySQL**: `Settings`
- Maps: `SettingID`, `InterestRates`, `PenaltyFee`, `GracePeriod`, `LoanThreshold`, `NegotiableThreshold`, `UpdatedAt`

## 🚀 Step 3: Run the Migration

Once you've configured the environment variables and verified your Access database structure, run the migration:

```bash
cd backend
npm run migrate
```

The migration will:
1. Connect to both Access and MySQL databases
2. Migrate data in the correct order (respecting foreign key relationships)
3. Handle duplicate records by updating existing ones
4. Provide progress updates and error reporting

## 📝 Migration Output

You'll see output like this during migration:

```
🚀 Starting Access to MySQL Migration...
=====================================
✅ Connected to MySQL database
✅ Connected to Access database
📤 Migrating Users...
✅ Migrated 5 users
📤 Migrating Borrowers...
✅ Migrated 150 borrowers
📤 Migrating Collaterals...
✅ Migrated 200 collaterals
📤 Migrating Loans...
✅ Migrated 180 loans
📤 Migrating Payments...
✅ Migrated 450 payments
📤 Migrating Expenses...
✅ Migrated 75 expenses
📤 Migrating Settings...
✅ Migrated settings
=====================================
🎉 Migration completed successfully!
```

## ⚠️ Important Notes

### 1. Data Type Considerations
- **Dates**: Access dates are converted to MySQL DATETIME format
- **Booleans**: Access Yes/No fields become MySQL TINYINT(1)
- **Text**: Access text fields are mapped to appropriate VARCHAR lengths
- **Numbers**: Numeric fields are preserved with appropriate precision

### 2. Foreign Key Relationships
The migration maintains referential integrity by:
- Migrating parent records (Users, Borrowers) before child records
- Looking up MySQL IDs for foreign key relationships
- Skipping records with missing parent references

### 3. Duplicate Handling
- Uses `ON DUPLICATE KEY UPDATE` to handle existing records
- Updates existing records instead of creating duplicates
- Preserves the most recent data

### 4. Error Handling
- Continues migration even if individual records fail
- Logs errors for manual review
- Provides summary of successful vs failed migrations

## 🔧 Troubleshooting

### Common Issues

**1. ODBC Connection Failed**
```
Error: [odbc] Error connecting to database
```
- Ensure Microsoft Access Database Engine is installed
- Check the ACCESS_DB_PATH in your .env file
- Verify the Access database file exists and is not locked

**2. Table Not Found**
```
Error: Table 'Users' not found in Access database
```
- Run `npm run check-access` to see available tables
- Update the migration script with your actual table names

**3. MySQL Connection Failed**
```
Error: ER_ACCESS_DENIED_ERROR
```
- Check your MySQL credentials in the .env file
- Ensure MySQL server is running
- Verify database exists

**4. Foreign Key Errors**
```
Borrower not found for loan/collateral
```
- This is normal if some relationships are broken in Access
- The migration skips these records and logs warnings

### Manual Data Fixes

If you need to manually adjust data after migration:

1. **Access the MySQL database directly** using phpMyAdmin, MySQL Workbench, or command line
2. **Update specific records** using SQL queries
3. **Re-run the migration** (it will update existing records without creating duplicates)

## 📞 Support

If you encounter issues:

1. Check the console output for specific error messages
2. Verify your Access database structure with `npm run check-access`
3. Ensure all environment variables are correctly set
4. Check that both databases are accessible

## ✅ Post-Migration Steps

After successful migration:

1. **Test the application** by logging in and checking data
2. **Verify relationships** between borrowers, loans, and collateral
3. **Check calculations** for loan amounts, payments, and balances
4. **Backup your Access database** (keep it as a reference)
5. **Update any hardcoded paths** in your application

## 🔄 Re-running Migration

The migration script is safe to re-run:
- It won't create duplicate records
- It will update existing records with new data
- Use this to fix data issues or add new records

```bash
npm run migrate
```

---

**Need Help?** Check the console output for detailed error messages and refer to the troubleshooting section above.