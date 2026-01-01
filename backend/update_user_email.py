import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
MYSQL_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'coreq_loans')
}

# Connect to MySQL
mysql_conn = mysql.connector.connect(**MYSQL_CONFIG)
cursor = mysql_conn.cursor()

# Update the user email
cursor.execute(
    "UPDATE users SET email = %s WHERE id = 1",
    ('admin@coreqcapital.com',)
)
mysql_conn.commit()

# Verify
cursor.execute("SELECT id, name, email FROM users WHERE id = 1")
user = cursor.fetchone()
print(f"Updated user:")
print(f"  ID: {user[0]}")
print(f"  Name: {user[1]}")
print(f"  Email: {user[2]}")

cursor.close()
mysql_conn.close()
print("\nEmail updated successfully!")
