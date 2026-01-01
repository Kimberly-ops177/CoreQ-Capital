import pyodbc
import os

ACCESS_DB_PATH = r'D:\coreq capital WORKING.accdb'

# Find Access driver
drivers = [driver for driver in pyodbc.drivers() if 'Access' in driver or 'access' in driver]
if not drivers:
    print('No Access drivers found!')
    exit(1)

selected_driver = drivers[0]
for driver in drivers:
    if '.accdb' in driver:
        selected_driver = driver
        break

print(f'Using driver: {selected_driver}\n')

# Connect to Access database
access_conn_str = f'Driver={{{selected_driver}}};DBQ={ACCESS_DB_PATH};'
access_conn = pyodbc.connect(access_conn_str)
cursor = access_conn.cursor()

print('Checking "defaulted items" table...\n')

# Get table structure
print('Table structure:')
for column in cursor.columns(table='defaulted items'):
    print(f'  {column.column_name} ({column.type_name})')

print('\nSample data (first 10 rows):')
cursor.execute('SELECT * FROM [defaulted items]')
rows = cursor.fetchmany(10)

if rows and len(rows) > 0:
    columns = [column[0] for column in cursor.description]
    print(f'\nColumns: {", ".join(columns)}\n')

    for row in rows:
        for i, col in enumerate(columns):
            print(f'  {col}: {row[i]}')
        print('---')
else:
    print('No data in table')

# Count total rows
cursor.execute('SELECT COUNT(*) FROM [defaulted items]')
count = cursor.fetchone()[0]
print(f'\nTotal rows in defaulted items: {count}')

cursor.close()
access_conn.close()
