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

# Fresh bcrypt hash for password "1234"
hashed_password = '$2b$08$jEeeu3d0DytLEQARmO4uVO27ulxeJ//l7IIwQE02/kRK4TQRJGSp6'

# Update the user password
cursor.execute(
    "UPDATE users SET password = %s WHERE email = %s",
    (hashed_password, 'admin@coreqcapital.com')
)
mysql_conn.commit()

# Verify
cursor.execute("SELECT id, name, email FROM users WHERE email = %s", ('admin@coreqcapital.com',))
user = cursor.fetchone()
print(f"Updated user:")
print(f"  ID: {user[0]}")
print(f"  Name: {user[1]}")
print(f"  Email: {user[2]}")

cursor.close()
mysql_conn.close()
print("\nPassword updated successfully!")
print("You can now login with:")
print("  Email: admin@coreqcapital.com")
print("  Password: 1234")
