# Database Migration Instructions

## Migration: Add 'closed' status to loans

This migration adds a new 'closed' status to the loan status enum, allowing admins to mark completed loans as closed instead of deleting them.

## Local Database (Already Completed ✓)
The migration has already been run on your local database.

## Production Database (Railway)

You need to run this migration on Railway's production database. Here are two methods:

### Method 1: Using Railway CLI (Recommended)

1. Install Railway CLI if you haven't:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link to your project:
   ```bash
   railway link
   ```

4. Run the migration:
   ```bash
   railway run node backend/run-migration.js
   ```

### Method 2: Using Railway Dashboard (Manual SQL)

1. Go to Railway dashboard: https://railway.app
2. Select your backend service
3. Click on "Data" or "Database" tab
4. Find your MySQL database
5. Click "Query" or open the database console
6. Copy and paste this SQL:

```sql
ALTER TABLE loans
MODIFY COLUMN status ENUM('active', 'due', 'pastDue', 'paid', 'defaulted', 'closed')
DEFAULT 'active';
```

7. Execute the query

## Verification

After running the migration, verify it worked:

```sql
SHOW COLUMNS FROM loans LIKE 'status';
```

You should see 'closed' in the list of enum values.

## What This Enables

- Admins can now call `POST /api/loans/:id/close` to mark loans as closed
- Closed loans are preserved in the database instead of being deleted
- Maintains audit trail for completed loans
