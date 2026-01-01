import pyodbc
import mysql.connector
import os
from dotenv import load_dotenv
import sys

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
        # List all available drivers for debugging
        print('Available ODBC drivers:')
        drivers = [driver for driver in pyodbc.drivers() if 'Access' in driver or 'access' in driver]
        for driver in drivers:
            print(f'  - {driver}')

        if not drivers:
            print('ERROR: No Access ODBC drivers found!')
            print('All available drivers:')
            for driver in pyodbc.drivers():
                print(f'  - {driver}')
            sys.exit(1)

        # Prefer the driver that supports both .mdb and .accdb
        selected_driver = None
        for driver in drivers:
            if '.accdb' in driver:
                selected_driver = driver
                break

        # Fallback to first driver if none found with .accdb support
        if not selected_driver:
            selected_driver = drivers[0]

        print(f'\nUsing driver: {selected_driver}')

        # Connect to Access database
        access_conn_str = (
            f'Driver={{{selected_driver}}};'
            f'DBQ={ACCESS_DB_PATH};'
        )
        print(f'Connection string: {access_conn_str}')
        access_conn = pyodbc.connect(access_conn_str)
        print('[OK] Connected to Access database')

        # Connect to MySQL database
        mysql_conn = mysql.connector.connect(**MYSQL_CONFIG)
        print('[OK] Connected to MySQL database')

        return access_conn, mysql_conn
    except Exception as e:
        print(f'[ERROR] Connection failed: {e}')
        sys.exit(1)

def get_access_tables(access_conn):
    """Get list of tables from Access database"""
    cursor = access_conn.cursor()
    tables = []
    for table_info in cursor.tables(tableType='TABLE'):
        table_name = table_info.table_name
        # Skip system tables
        if not table_name.startswith('MSys'):
            tables.append(table_name)
    return tables

def check_access_structure(access_conn):
    """Display structure of Access database"""
    print('\n[INFO] Access Database Structure:')
    print('=' * 50)

    tables = get_access_tables(access_conn)
    cursor = access_conn.cursor()

    for table in tables:
        print(f'\n[TABLE] {table}')
        columns = cursor.columns(table=table)
        print('  Columns:')
        for column in columns:
            print(f'    - {column.column_name} ({column.type_name})')

    cursor.close()

def migrate_data(access_conn, mysql_conn):
    """Migrate data from Access to MySQL"""
    access_cursor = access_conn.cursor()
    mysql_cursor = mysql_conn.cursor()

    print('\n[INFO] Starting Migration...')
    print('=' * 50)

    tables = get_access_tables(access_conn)

    for table in tables:
        try:
            print(f'\n[MIGRATING] Table: {table}')

            # Get data from Access
            access_cursor.execute(f'SELECT * FROM [{table}]')
            rows = access_cursor.fetchall()

            if not rows:
                print(f'  [WARNING] No data found in {table}')
                continue

            # Get column names
            columns = [column[0] for column in access_cursor.description]

            # Check if table exists in MySQL
            mysql_cursor.execute(f"SHOW TABLES LIKE '{table}'")
            if not mysql_cursor.fetchone():
                print(f'  [WARNING] Table {table} does not exist in MySQL. Skipping...')
                continue

            # Insert data into MySQL
            placeholders = ', '.join(['%s'] * len(columns))
            column_names = ', '.join([f'`{col}`' for col in columns])
            insert_query = f'INSERT INTO `{table}` ({column_names}) VALUES ({placeholders})'

            # Handle duplicate keys
            update_clause = ', '.join([f'`{col}`=VALUES(`{col}`)' for col in columns])
            insert_query += f' ON DUPLICATE KEY UPDATE {update_clause}'

            migrated_count = 0
            for row in rows:
                try:
                    mysql_cursor.execute(insert_query, tuple(row))
                    migrated_count += 1
                except Exception as e:
                    print(f'  [WARNING] Error inserting row: {e}')

            mysql_conn.commit()
            print(f'  [SUCCESS] Migrated {migrated_count} rows from {table}')

        except Exception as e:
            print(f'  [ERROR] Error migrating {table}: {e}')

    access_cursor.close()
    mysql_cursor.close()

    print('\n' + '=' * 50)
    print('[SUCCESS] Migration completed!')

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == '--check':
        # Check mode
        access_conn, mysql_conn = connect_to_databases()
        check_access_structure(access_conn)
        access_conn.close()
        mysql_conn.close()
    else:
        # Migration mode
        access_conn, mysql_conn = connect_to_databases()
        migrate_data(access_conn, mysql_conn)
        access_conn.close()
        mysql_conn.close()

if __name__ == '__main__':
    main()
