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

# Bcrypt hash for password "1234"
hashed_password = '$2b$08$UJak.sGeDWfU0psop1UbiObvntpudjLQ35Dr/Jjz.x19XR7AIfyO.'

# Update the user
cursor.execute(
    "UPDATE users SET password = %s WHERE id = 1",
    (hashed_password,)
)
mysql_conn.commit()

# Verify
cursor.execute("SELECT id, email, password FROM users WHERE id = 1")
user = cursor.fetchone()
print(f"Updated user: {user[1]}")
print(f"Password hash: {user[2]}")

cursor.close()
mysql_conn.close()
