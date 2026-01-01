import pyodbc
import mysql.connector
import os
from dotenv import load_dotenv
import sys
from datetime import datetime

# Load environment variables
load_dotenv()

# Database configurations
MYSQL_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'coreq_loans')
}

ACCESS_DB_PATH = r'D:\coreq capital WORKING.accdb'

def connect_to_databases():
    """Connect to both Access and MySQL databases"""
    try:
        # Find Access driver
        drivers = [driver for driver in pyodbc.drivers() if 'Access' in driver or 'access' in driver]
        if not drivers:
            print('[ERROR] No Access ODBC drivers found!')
            sys.exit(1)

        selected_driver = None
        for driver in drivers:
            if '.accdb' in driver:
                selected_driver = driver
                break
        if not selected_driver:
            selected_driver = drivers[0]

        print(f'Using ODBC driver: {selected_driver}')

        # Connect to Access
        access_conn_str = f'Driver={{{selected_driver}}};DBQ={ACCESS_DB_PATH};'
        access_conn = pyodbc.connect(access_conn_str)
        print('[OK] Connected to Access database')

        # Connect to MySQL
        mysql_conn = mysql.connector.connect(**MYSQL_CONFIG)
        print('[OK] Connected to MySQL database')

        return access_conn, mysql_conn
    except Exception as e:
        print(f'[ERROR] Connection failed: {e}')
        sys.exit(1)

def drop_all_tables(mysql_conn):
    """Drop all existing tables"""
    cursor = mysql_conn.cursor()
    cursor.execute('SET FOREIGN_KEY_CHECKS = 0')

    cursor.execute('SHOW TABLES')
    tables = cursor.fetchall()

    print('\n[INFO] Dropping all existing tables...')
    for (table_name,) in tables:
        cursor.execute(f'DROP TABLE IF EXISTS `{table_name}`')
        print(f'  [DROPPED] {table_name}')

    cursor.execute('SET FOREIGN_KEY_CHECKS = 1')
    mysql_conn.commit()
    cursor.close()
    print('[SUCCESS] All tables dropped\n')

def create_schema(mysql_conn):
    """Create MySQL schema according to requirements"""
    cursor = mysql_conn.cursor()

    print('[INFO] Creating MySQL schema...')
    print('=' * 50)

    # Users table
    cursor.execute('''
        CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
            permissions JSON,
            isActive TINYINT(1) DEFAULT 1,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ''')
    print('[OK] Created: users')

    # Borrowers table
    cursor.execute('''
        CREATE TABLE borrowers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fullName VARCHAR(255) NOT NULL,
            idNumber VARCHAR(255) NOT NULL UNIQUE,
            phoneNumber VARCHAR(50) NOT NULL,
            emergencyNumber VARCHAR(50),
            email VARCHAR(255),
            location VARCHAR(255) NOT NULL,
            apartment VARCHAR(255),
            houseNumber VARCHAR(255),
            isStudent TINYINT(1) DEFAULT 0,
            institution VARCHAR(255),
            registrationNumber VARCHAR(255),
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ''')
    print('[OK] Created: borrowers')

    # Collaterals table
    cursor.execute('''
        CREATE TABLE collaterals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            borrowerId INT NOT NULL,
            category VARCHAR(255),
            itemName VARCHAR(255) NOT NULL,
            modelNumber VARCHAR(255),
            serialNumber TEXT,
            itemCondition VARCHAR(255),
            isSeized TINYINT(1) DEFAULT 0,
            isSold TINYINT(1) DEFAULT 0,
            soldPrice DECIMAL(10,2),
            soldDate DATETIME,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (borrowerId) REFERENCES borrowers(id) ON DELETE CASCADE
        )
    ''')
    print('[OK] Created: collaterals')

    # Loans table
    cursor.execute('''
        CREATE TABLE loans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            borrowerId INT NOT NULL,
            collateralId INT NOT NULL,
            amountIssued DECIMAL(10,2) NOT NULL,
            dateIssued DATETIME NOT NULL,
            loanPeriod INT NOT NULL,
            interestRate DECIMAL(5,2) NOT NULL,
            dueDate DATETIME NOT NULL,
            gracePeriodEnd DATETIME,
            status ENUM('active', 'paid', 'defaulted', 'pastDue') DEFAULT 'active',
            totalAmount DECIMAL(10,2) NOT NULL,
            penalties DECIMAL(10,2) DEFAULT 0,
            isNegotiable TINYINT(1) DEFAULT 0,
            lastPenaltyDate DATETIME,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (borrowerId) REFERENCES borrowers(id) ON DELETE CASCADE,
            FOREIGN KEY (collateralId) REFERENCES collaterals(id) ON DELETE CASCADE
        )
    ''')
    print('[OK] Created: loans')

    # Payments table
    cursor.execute('''
        CREATE TABLE payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            loanId INT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            paymentDate DATETIME NOT NULL,
            note TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (loanId) REFERENCES loans(id) ON DELETE CASCADE
        )
    ''')
    print('[OK] Created: payments')

    # Expenses table
    cursor.execute('''
        CREATE TABLE expenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            date DATETIME NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            addedBy INT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (addedBy) REFERENCES users(id) ON DELETE SET NULL
        )
    ''')
    print('[OK] Created: expenses')

    # Settings table
    cursor.execute('''
        CREATE TABLE settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            interestRates JSON NOT NULL,
            penaltyFee DECIMAL(5,2) DEFAULT 3.00,
            gracePeriod INT DEFAULT 7,
            loanThreshold DECIMAL(10,2) DEFAULT 12000.00,
            negotiableThreshold DECIMAL(10,2) DEFAULT 50000.00,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ''')
    print('[OK] Created: settings')

    mysql_conn.commit()
    cursor.close()

    print('=' * 50)
    print('[SUCCESS] Schema created successfully!\n')

def migrate_borrowers(access_conn, mysql_conn):
    """Migrate borrowers from Access client table"""
    access_cursor = access_conn.cursor()
    mysql_cursor = mysql_conn.cursor()

    print('[MIGRATING] Borrowers...')

    # Get data from Access
    access_cursor.execute('SELECT * FROM [client]')
    rows = access_cursor.fetchall()

    migrated = 0
    for row in rows:
        try:
            # Map Access columns to MySQL columns
            # Access: ID NUMBER, Name, Phone number, Emergency No, Location, Email,
            #         Apartment, House Number, Institution, Registration No
            mysql_cursor.execute('''
                INSERT INTO borrowers
                (id, fullName, idNumber, phoneNumber, emergencyNumber, email,
                 location, apartment, houseNumber, isStudent, institution, registrationNumber)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                row[0],  # ID NUMBER -> id
                row[1],  # Name -> fullName
                str(row[0]),  # ID NUMBER -> idNumber
                str(row[2]) if row[2] else '',  # Phone number -> phoneNumber
                str(row[3]) if row[3] else None,  # Emergency No -> emergencyNumber
                row[5] if row[5] else None,  # Email
                row[4] if row[4] else '',  # Location
                row[6] if row[6] else None,  # Apartment
                row[7] if row[7] else None,  # House Number
                1 if row[8] else 0,  # Institution present -> isStudent
                row[8] if row[8] else None,  # Institution
                row[9] if row[9] else None   # Registration No
            ))
            migrated += 1
        except Exception as e:
            print(f'  [WARNING] Error migrating borrower: {str(e)[:100]}')

    mysql_conn.commit()
    print(f'  [SUCCESS] Migrated {migrated}/{len(rows)} borrowers\n')

    access_cursor.close()
    mysql_cursor.close()

def migrate_collaterals(access_conn, mysql_conn):
    """Migrate collaterals from Access ITEMS table"""
    access_cursor = access_conn.cursor()
    mysql_cursor = mysql_conn.cursor()

    print('[MIGRATING] Collaterals...')

    # Get data from Access
    access_cursor.execute('SELECT * FROM [ITEMS]')
    rows = access_cursor.fetchall()

    migrated = 0
    for row in rows:
        try:
            # Access: ITEMID, ID NUMBER, ITEM, SERIAL NO, MODEL NO, CONDITION, ITEM PHOTO
            mysql_cursor.execute('''
                INSERT INTO collaterals
                (id, borrowerId, itemName, serialNumber, modelNumber, itemCondition)
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (
                row[0],  # ITEMID -> id
                row[1],  # ID NUMBER -> borrowerId
                row[2] if row[2] else 'Unknown',  # ITEM -> itemName
                row[3] if row[3] else None,  # SERIAL NO
                row[4] if row[4] else None,  # MODEL NO
                row[5] if row[5] else None   # CONDITION
            ))
            migrated += 1
        except Exception as e:
            print(f'  [WARNING] Error migrating collateral: {str(e)[:100]}')

    mysql_conn.commit()
    print(f'  [SUCCESS] Migrated {migrated}/{len(rows)} collaterals\n')

    access_cursor.close()
    mysql_cursor.close()

def migrate_loans(access_conn, mysql_conn):
    """Migrate loans from Access LOANS table"""
    access_cursor = access_conn.cursor()
    mysql_cursor = mysql_conn.cursor()

    print('[MIGRATING] Loans...')

    # Get data from Access
    access_cursor.execute('SELECT * FROM [LOANS]')
    rows = access_cursor.fetchall()

    migrated = 0
    for row in rows:
        try:
            # Access: LOANID, ID NUMBER, AMOUNT ISSUED, DATE ISSUED, LOAN PERIOD, ITEM ID
            loan_id = row[0]
            borrower_id = row[1]
            amount_issued = float(row[2]) if row[2] else 0
            date_issued = row[3] if row[3] else datetime.now()
            loan_period = int(row[4]) if row[4] else 1
            collateral_id = row[5]

            # Calculate interest rate based on loan period
            interest_rate = 20.0  # default 1 week
            if loan_period == 2:
                interest_rate = 28.0
            elif loan_period == 3:
                interest_rate = 32.0
            elif loan_period >= 4:
                interest_rate = 35.0

            # Calculate total amount
            interest_amount = amount_issued * (interest_rate / 100)
            total_amount = amount_issued + interest_amount

            # Calculate due date (loan_period is in weeks)
            from datetime import timedelta
            if isinstance(date_issued, datetime):
                due_date = date_issued + timedelta(weeks=loan_period)
                grace_period_end = due_date + timedelta(days=7)
            else:
                due_date = datetime.now() + timedelta(weeks=loan_period)
                grace_period_end = due_date + timedelta(days=7)

            mysql_cursor.execute('''
                INSERT INTO loans
                (id, borrowerId, collateralId, amountIssued, dateIssued, loanPeriod,
                 interestRate, dueDate, gracePeriodEnd, totalAmount, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                loan_id,
                borrower_id,
                collateral_id,
                amount_issued,
                date_issued,
                loan_period,
                interest_rate,
                due_date,
                grace_period_end,
                total_amount,
                'active'
            ))
            migrated += 1
        except Exception as e:
            print(f'  [WARNING] Error migrating loan {row[0]}: {str(e)[:100]}')

    mysql_conn.commit()
    print(f'  [SUCCESS] Migrated {migrated}/{len(rows)} loans\n')

    access_cursor.close()
    mysql_cursor.close()

def migrate_payments(access_conn, mysql_conn):
    """Migrate payments from Access PAYMENT TABLE"""
    access_cursor = access_conn.cursor()
    mysql_cursor = mysql_conn.cursor()

    print('[MIGRATING] Payments...')

    try:
        access_cursor.execute('SELECT * FROM [PAYMENT TABLE]')
        rows = access_cursor.fetchall()

        migrated = 0
        for row in rows:
            try:
                # Access: PAYMENTID, LOANID, AMOUNT PAID, DATE PAID, COMMENT
                mysql_cursor.execute('''
                    INSERT INTO payments
                    (id, loanId, amount, paymentDate, note)
                    VALUES (%s, %s, %s, %s, %s)
                ''', (
                    row[0],  # PAYMENTID
                    row[1],  # LOANID
                    float(row[2]) if row[2] else 0,  # AMOUNT PAID
                    row[3] if row[3] else datetime.now(),  # DATE PAID
                    row[4] if row[4] else None  # COMMENT
                ))
                migrated += 1
            except Exception as e:
                print(f'  [WARNING] Error migrating payment: {str(e)[:100]}')

        mysql_conn.commit()
        print(f'  [SUCCESS] Migrated {migrated}/{len(rows)} payments\n')
    except Exception as e:
        print(f'  [ERROR] Could not migrate payments: {e}\n')

    access_cursor.close()
    mysql_cursor.close()

def migrate_expenses(access_conn, mysql_conn):
    """Migrate expenses from Access EXPENDITURE table"""
    access_cursor = access_conn.cursor()
    mysql_cursor = mysql_conn.cursor()

    print('[MIGRATING] Expenses...')

    try:
        access_cursor.execute('SELECT * FROM [EXPENDITURE]')
        rows = access_cursor.fetchall()

        migrated = 0
        for row in rows:
            try:
                # Access: ID, CATEGORY, DATE, AMOUNT
                mysql_cursor.execute('''
                    INSERT INTO expenses
                    (id, category, name, date, amount)
                    VALUES (%s, %s, %s, %s, %s)
                ''', (
                    row[0],  # ID
                    row[1] if row[1] else 'General',  # CATEGORY
                    row[1] if row[1] else 'Expense',  # name (use category as name)
                    row[2] if row[2] else datetime.now(),  # DATE
                    float(row[3]) if row[3] else 0  # AMOUNT
                ))
                migrated += 1
            except Exception as e:
                print(f'  [WARNING] Error migrating expense: {str(e)[:100]}')

        mysql_conn.commit()
        print(f'  [SUCCESS] Migrated {migrated}/{len(rows)} expenses\n')
    except Exception as e:
        print(f'  [ERROR] Could not migrate expenses: {e}\n')

    access_cursor.close()
    mysql_cursor.close()

def migrate_users(access_conn, mysql_conn):
    """Migrate users from Access Users table"""
    access_cursor = access_conn.cursor()
    mysql_cursor = mysql_conn.cursor()

    print('[MIGRATING] Users...')

    try:
        access_cursor.execute('SELECT * FROM [Users]')
        rows = access_cursor.fetchall()

        migrated = 0
        for row in rows:
            try:
                # Access: ID, USERNAME, PASSWORD
                mysql_cursor.execute('''
                    INSERT INTO users
                    (id, username, password, role)
                    VALUES (%s, %s, %s, %s)
                ''', (
                    row[0],  # ID
                    row[1] if row[1] else f'user{row[0]}',  # USERNAME
                    row[2] if row[2] else 'password',  # PASSWORD (already hashed)
                    'admin'  # Default to admin for migrated users
                ))
                migrated += 1
            except Exception as e:
                print(f'  [WARNING] Error migrating user: {str(e)[:100]}')

        mysql_conn.commit()
        print(f'  [SUCCESS] Migrated {migrated}/{len(rows)} users\n')
    except Exception as e:
        print(f'  [ERROR] Could not migrate users: {e}\n')

    access_cursor.close()
    mysql_cursor.close()

def create_default_settings(mysql_conn):
    """Create default settings"""
    cursor = mysql_conn.cursor()

    print('[INFO] Creating default settings...')

    interest_rates = {
        "1": 20,
        "2": 28,
        "3": 32,
        "4": 35
    }

    import json
    cursor.execute('''
        INSERT INTO settings (interestRates, penaltyFee, gracePeriod, loanThreshold, negotiableThreshold)
        VALUES (%s, %s, %s, %s, %s)
    ''', (json.dumps(interest_rates), 3.00, 7, 12000.00, 50000.00))

    mysql_conn.commit()
    cursor.close()
    print('[OK] Default settings created\n')

def main():
    """Main migration function"""
    print('\n' + '=' * 50)
    print('COMPREHENSIVE ACCESS TO MYSQL MIGRATION')
    print('=' * 50 + '\n')

    # Connect
    access_conn, mysql_conn = connect_to_databases()

    # Drop all existing tables
    drop_all_tables(mysql_conn)

    # Create new schema
    create_schema(mysql_conn)

    # Migrate data
    migrate_users(access_conn, mysql_conn)
    migrate_borrowers(access_conn, mysql_conn)
    migrate_collaterals(access_conn, mysql_conn)
    migrate_loans(access_conn, mysql_conn)
    migrate_payments(access_conn, mysql_conn)
    migrate_expenses(access_conn, mysql_conn)

    # Create default settings
    create_default_settings(mysql_conn)

    # Close connections
    access_conn.close()
    mysql_conn.close()

    print('=' * 50)
    print('[SUCCESS] MIGRATION COMPLETED SUCCESSFULLY!')
    print('=' * 50)

if __name__ == '__main__':
    main()
