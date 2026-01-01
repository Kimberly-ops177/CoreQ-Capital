import pyodbc
import mysql.connector
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

ACCESS_DB_PATH = r'D:\coreq capital WORKING.accdb'

# MySQL config
MYSQL_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'coreq_loans')
}

# Connect to Access
drivers = [driver for driver in pyodbc.drivers() if 'Access' in driver or 'access' in driver]
selected_driver = drivers[0]
for driver in drivers:
    if '.accdb' in driver:
        selected_driver = driver
        break

access_conn = pyodbc.connect(f'Driver={{{selected_driver}}};DBQ={ACCESS_DB_PATH};')
access_cursor = access_conn.cursor()

# Connect to MySQL
mysql_conn = mysql.connector.connect(**MYSQL_CONFIG)
mysql_cursor = mysql_conn.cursor(dictionary=True)

print('Fetching defaulted items from Access...\n')

# Get all defaulted items
access_cursor.execute('SELECT * FROM [defaulted items]')
defaulted_items = access_cursor.fetchall()

print(f'Found {len(defaulted_items)} defaulted items')

# Process each defaulted item
defaulted_count = 0
for item in defaulted_items:
    item_id = item[0]  # ITEMID
    sold = item[5]  # SOLD
    amount = item[6]  # AMOUNT
    date_sold = item[7]  # DATE SOLD

    # Find matching collateral
    mysql_cursor.execute('SELECT * FROM collaterals WHERE id = %s', (item_id,))
    collateral = mysql_cursor.fetchone()

    if collateral:
        # Update collateral as seized and sold
        update_sql = '''
            UPDATE collaterals
            SET isSeized = 1, isSold = %s, soldPrice = %s, soldDate = %s
            WHERE id = %s
        '''
        mysql_cursor.execute(update_sql, (
            1 if sold else 0,
            float(amount) if amount else None,
            date_sold if date_sold else None,
            item_id
        ))

        # Find and update the loan for this collateral
        mysql_cursor.execute('SELECT * FROM loans WHERE collateralId = %s', (item_id,))
        loan = mysql_cursor.fetchone()

        if loan:
            mysql_cursor.execute('UPDATE loans SET status = %s WHERE id = %s', ('defaulted', loan['id']))
            defaulted_count += 1

mysql_conn.commit()

print(f'\nUpdated {defaulted_count} loans to defaulted status based on defaulted items')

# Now update remaining loans based on their due dates
print('\nUpdating remaining loan statuses based on due dates...')

mysql_cursor.execute('''
    SELECT * FROM loans
    WHERE status != 'defaulted' AND status != 'paid'
''')
remaining_loans = mysql_cursor.fetchall()

now = datetime.now()
active_count = 0
past_due_count = 0

for loan in remaining_loans:
    due_date = loan['dueDate']
    grace_period_end = loan['gracePeriodEnd']

    if grace_period_end and now >= grace_period_end:
        # Overdue past grace period - should be defaulted
        mysql_cursor.execute('UPDATE loans SET status = %s WHERE id = %s', ('defaulted', loan['id']))
        # Mark collateral as seized
        if loan['collateralId']:
            mysql_cursor.execute('UPDATE collaterals SET isSeized = 1 WHERE id = %s', (loan['collateralId'],))
        defaulted_count += 1
    elif now >= due_date:
        # Past due but still in grace period
        mysql_cursor.execute('UPDATE loans SET status = %s WHERE id = %s', ('pastDue', loan['id']))
        past_due_count += 1
    elif now.date() == due_date.date():
        # Due today
        mysql_cursor.execute('UPDATE loans SET status = %s WHERE id = %s', ('due', loan['id']))
        active_count += 1
    else:
        # Still active
        mysql_cursor.execute('UPDATE loans SET status = %s WHERE id = %s', ('active', loan['id']))
        active_count += 1

mysql_conn.commit()

print(f'Active loans: {active_count}')
print(f'Past due loans: {past_due_count}')
print(f'Total defaulted loans: {defaulted_count}')

# Summary
mysql_cursor.execute('SELECT status, COUNT(*) as count FROM loans GROUP BY status')
summary = mysql_cursor.fetchall()

print('\nFinal loan status summary:')
for row in summary:
    print(f'  {row["status"]}: {row["count"]}')

access_cursor.close()
access_conn.close()
mysql_cursor.close()
mysql_conn.close()

print('\nDone!')
