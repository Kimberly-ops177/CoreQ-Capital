# Admin Password Update Instructions

## Local Database ✓ COMPLETED
The admin password has been updated in your local database.

**New Credentials:**
- Email: `admin@coreqcapital.com`
- Password: `Admin@5432`

## Production Database (Railway) - ACTION REQUIRED

You need to update the password in production as well. Here are your options:

### Option 1: Using Railway CLI (Recommended)

Run this in Git Bash:

```bash
railway run node -e "
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  const newPassword = 'Admin@5432';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await connection.query(
    'UPDATE users SET password = ? WHERE email = ?',
    [hashedPassword, 'admin@coreqcapital.com']
  );

  console.log('✓ Production admin password updated!');
  await connection.end();
})();
"
```

### Option 2: Manual SQL in Railway Dashboard

1. Go to Railway dashboard
2. Click on MySQL database
3. Find the Query/SQL console
4. Run this SQL (you'll need to generate the hash first):

**First, generate the password hash locally:**
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Admin@5432', 10).then(h => console.log(h));"
```

**Then run this SQL in Railway with the hash:**
```sql
UPDATE users
SET password = '<paste-the-hash-here>'
WHERE email = 'admin@coreqcapital.com';
```

## Security Note

Make sure to keep this password secure and don't commit it to your repository!
