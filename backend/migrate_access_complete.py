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

# Access to MySQL data type mapping
TYPE_MAPPING = {
    'COUNTER': 'INT AUTO_INCREMENT PRIMARY KEY',
    'INTEGER': 'INT',
    'SMALLINT': 'SMALLINT',
    'BIGINT': 'BIGINT',
    'REAL': 'FLOAT',
    'DOUBLE': 'DOUBLE',
    'CURRENCY': 'DECIMAL(19,4)',
    'DATETIME': 'DATETIME',
    'DATE': 'DATE',
    'TIME': 'TIME',
    'BIT': 'TINYINT(1)',
    'BYTE': 'TINYINT UNSIGNED',
    'VARCHAR': 'VARCHAR(255)',
    'LONGCHAR': 'TEXT',
    'MEMO': 'TEXT',
    'LONGBINARY': 'BLOB',
    'BINARY': 'VARBINARY(255)',
    'GUID': 'CHAR(36)'
}

def connect_to_databases():
    """Connect to both Access and MySQL databases"""
    try:
        # Find Access driver
        drivers = [driver for driver in pyodbc.drivers() if 'Access' in driver or 'access' in driver]

        if not drivers:
            print('[ERROR] No Access ODBC drivers found!')
            sys.exit(1)

        # Prefer driver that supports .accdb
        selected_driver = None
        for driver in drivers:
            if '.accdb' in driver:
                selected_driver = driver
                break

        if not selected_driver:
            selected_driver = drivers[0]

        print(f'Using driver: {selected_driver}')

        # Connect to Access database
        access_conn_str = f'Driver={{{selected_driver}}};DBQ={ACCESS_DB_PATH};'
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

def map_access_type_to_mysql(access_type, column_size=None):
    """Map Access data type to MySQL data type"""
    access_type = access_type.upper()

    # Handle VARCHAR with size
    if access_type == 'VARCHAR' and column_size:
        return f'VARCHAR({column_size})'

    return TYPE_MAPPING.get(access_type, 'TEXT')

def create_mysql_tables(access_conn, mysql_conn):
    """Create MySQL tables based on Access database structure"""
    access_cursor = access_conn.cursor()
    mysql_cursor = mysql_conn.cursor()

    print('\n[INFO] Creating MySQL tables...')
    print('=' * 50)

    # Disable foreign key checks temporarily
    mysql_cursor.execute('SET FOREIGN_KEY_CHECKS = 0')

    tables = get_access_tables(access_conn)

    for table in tables:
        try:
            print(f'\n[CREATING] Table: {table}')

            # Drop table if exists
            mysql_cursor.execute(f'DROP TABLE IF EXISTS `{table}`')

            # Get column information from Access
            columns_info = []
            has_primary_key = False

            for column in access_cursor.columns(table=table):
                col_name = column.column_name
                col_type = column.type_name
                col_size = column.column_size
                is_nullable = column.nullable

                # Map to MySQL type
                mysql_type = map_access_type_to_mysql(col_type, col_size)

                # Check if this is a primary key (COUNTER type)
                if col_type.upper() == 'COUNTER':
                    has_primary_key = True
                    column_def = f'`{col_name}` {mysql_type}'
                else:
                    nullable = '' if is_nullable else 'NOT NULL'
                    column_def = f'`{col_name}` {mysql_type} {nullable}'

                columns_info.append(column_def)

            # Create table SQL
            create_table_sql = f"CREATE TABLE `{table}` (\n  " + ",\n  ".join(columns_info) + "\n)"

            # Execute
            mysql_cursor.execute(create_table_sql)
            mysql_conn.commit()

            print(f'  [SUCCESS] Created table: {table}')

        except Exception as e:
            print(f'  [ERROR] Error creating table {table}: {e}')

    # Re-enable foreign key checks
    mysql_cursor.execute('SET FOREIGN_KEY_CHECKS = 1')
    mysql_conn.commit()

    access_cursor.close()
    mysql_cursor.close()

    print('\n' + '=' * 50)
    print('[SUCCESS] All tables created!')

def migrate_data(access_conn, mysql_conn):
    """Migrate data from Access to MySQL"""
    access_cursor = access_conn.cursor()
    mysql_cursor = mysql_conn.cursor()

    print('\n[INFO] Starting data migration...')
    print('=' * 50)

    tables = get_access_tables(access_conn)
    total_migrated = 0

    for table in tables:
        try:
            print(f'\n[MIGRATING] Table: {table}')

            # Get data from Access
            access_cursor.execute(f'SELECT * FROM [{table}]')
            rows = access_cursor.fetchall()

            if not rows:
                print(f'  [INFO] No data in {table}')
                continue

            # Get column names
            columns = [column[0] for column in access_cursor.description]

            # Prepare insert query
            placeholders = ', '.join(['%s'] * len(columns))
            column_names = ', '.join([f'`{col}`' for col in columns])
            insert_query = f'INSERT INTO `{table}` ({column_names}) VALUES ({placeholders})'

            # Insert data
            migrated_count = 0
            for row in rows:
                try:
                    # Convert row data - handle None values and special types
                    clean_row = []
                    for value in row:
                        if value is None:
                            clean_row.append(None)
                        else:
                            clean_row.append(value)

                    mysql_cursor.execute(insert_query, tuple(clean_row))
                    migrated_count += 1
                except Exception as e:
                    print(f'  [WARNING] Error inserting row: {str(e)[:100]}')

            mysql_conn.commit()
            total_migrated += migrated_count
            print(f'  [SUCCESS] Migrated {migrated_count}/{len(rows)} rows')

        except Exception as e:
            print(f'  [ERROR] Error migrating {table}: {e}')

    access_cursor.close()
    mysql_cursor.close()

    print('\n' + '=' * 50)
    print(f'[SUCCESS] Migration completed! Total rows migrated: {total_migrated}')

def verify_migration(access_conn, mysql_conn):
    """Verify that data was migrated correctly"""
    access_cursor = access_conn.cursor()
    mysql_cursor = mysql_conn.cursor()

    print('\n[INFO] Verifying migration...')
    print('=' * 50)

    tables = get_access_tables(access_conn)
    all_match = True

    for table in tables:
        try:
            # Count rows in Access
            access_cursor.execute(f'SELECT COUNT(*) FROM [{table}]')
            access_count = access_cursor.fetchone()[0]

            # Count rows in MySQL
            mysql_cursor.execute(f'SELECT COUNT(*) FROM `{table}`')
            mysql_count = mysql_cursor.fetchone()[0]

            if access_count == mysql_count:
                print(f'[OK] {table}: {mysql_count} rows')
            else:
                print(f'[WARNING] {table}: Access={access_count}, MySQL={mysql_count}')
                all_match = False

        except Exception as e:
            print(f'[ERROR] Error verifying {table}: {e}')
            all_match = False

    access_cursor.close()
    mysql_cursor.close()

    print('=' * 50)
    if all_match:
        print('[SUCCESS] All tables verified successfully!')
    else:
        print('[WARNING] Some tables have mismatched row counts')

def main():
    """Main function"""
    print('\n' + '=' * 50)
    print('ACCESS TO MYSQL MIGRATION TOOL')
    print('=' * 50)

    # Connect to databases
    access_conn, mysql_conn = connect_to_databases()

    if len(sys.argv) > 1:
        mode = sys.argv[1]

        if mode == '--create-tables':
            # Create tables only
            create_mysql_tables(access_conn, mysql_conn)

        elif mode == '--migrate-data':
            # Migrate data only
            migrate_data(access_conn, mysql_conn)

        elif mode == '--verify':
            # Verify migration
            verify_migration(access_conn, mysql_conn)

        else:
            print('[ERROR] Unknown option. Use:')
            print('  --create-tables  : Create MySQL tables matching Access structure')
            print('  --migrate-data   : Migrate data from Access to MySQL')
            print('  --verify         : Verify migration')
            print('  (no option)      : Do everything (create tables + migrate + verify)')
    else:
        # Do everything
        create_mysql_tables(access_conn, mysql_conn)
        migrate_data(access_conn, mysql_conn)
        verify_migration(access_conn, mysql_conn)

    # Close connections
    access_conn.close()
    mysql_conn.close()

    print('\n[DONE] Migration process completed!')

if __name__ == '__main__':
    main()
