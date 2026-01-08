# Manual Migration Steps for Railway MySQL

Since the Query Console isn't available in your Railway interface, here's the **easiest alternative method**:

---

## ✅ Easiest Method: Railway Connect Command

### Step 1: Open Railway MySQL Shell

Open your terminal/command prompt and run:

```bash
cd "c:\Users\USER\Documents\CORE-Q VIBE-CODED"
railway connect MySQL
```

This will connect you directly to your Railway MySQL database.

---

### Step 2: Copy and Paste These SQL Commands

Once you're connected to the MySQL shell (you'll see `mysql>` prompt), copy and paste each section below **one at a time**:

---

#### **Migration 1: Add Loan ID Field**

```sql
-- Check if loanId column exists
SELECT COUNT(*) as column_exists FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'loans' AND column_name = 'loanId';

-- If it returns 0, run these commands:
ALTER TABLE loans ADD COLUMN loanId VARCHAR(50) UNIQUE AFTER id;
CREATE INDEX idx_loans_loanId ON loans(loanId);

-- Generate loan IDs for existing loans
UPDATE loans
SET loanId = CONCAT('CQC-', YEAR(dateIssued), '-', LPAD(id, 4, '0'))
WHERE loanId IS NULL;

-- Verify (should show the new column)
DESCRIBE loans;
```

**✅ Expected Result:** You should see `loanId` column with type `varchar(50)` and key `UNI`

---

#### **Migration 2: Update Expense Categories**

```sql
-- Check current categories
SELECT DISTINCT category FROM expenses;

-- Update non-standard categories to 'Others'
UPDATE expenses SET category = 'Others'
WHERE category NOT IN ('Rent', 'Salary', 'Printing', 'Others');

-- Modify column to ENUM
ALTER TABLE expenses
MODIFY COLUMN category ENUM('Rent', 'Salary', 'Printing', 'Others') NOT NULL;

-- Verify (should show ENUM type)
SHOW COLUMNS FROM expenses LIKE 'category';
```

**✅ Expected Result:** Category column type should be `enum('Rent','Salary','Printing','Others')`

---

#### **Migration 3: Update Loan Agreement Status**

```sql
-- Update existing loans from pending_upload to pending_approval
UPDATE loans
SET agreementStatus = 'pending_approval'
WHERE agreementStatus = 'pending_upload';

-- Modify the default value
ALTER TABLE loans
MODIFY COLUMN agreementStatus ENUM('pending_upload', 'pending_approval', 'approved', 'rejected')
DEFAULT 'pending_approval';

-- Verify
SELECT column_default FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'loans' AND column_name = 'agreementStatus';
```

**✅ Expected Result:** Default value should be `'pending_approval'`

---

### Step 3: Final Verification

Run these commands to verify all migrations succeeded:

```sql
-- Check loanId column
SHOW COLUMNS FROM loans LIKE 'loanId';

-- Check expense category
SHOW COLUMNS FROM expenses LIKE 'category';

-- Check loan agreement status default
SELECT column_default FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'loans' AND column_name = 'agreementStatus';

-- Count loans with IDs
SELECT
  COUNT(*) as total_loans,
  COUNT(loanId) as loans_with_id,
  COUNT(*) - COUNT(loanId) as loans_without_id
FROM loans;
```

---

### Step 4: Exit MySQL Shell

```sql
exit;
```

---

## 🔧 Alternative Method: Direct MySQL Connection

If `railway connect` doesn't work, you can also connect directly using MySQL client:

### Get Database URL

```bash
railway variables --service MySQL
```

Look for these variables:
- `MYSQL_HOST` or `MYSQL_URL`
- `MYSQL_USER` (usually `root`)
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE` (usually `railway`)

### Connect Using MySQL Client

```bash
mysql -h [MYSQL_HOST] -u [MYSQL_USER] -p[MYSQL_PASSWORD] [MYSQL_DATABASE]
```

Then follow Steps 2-4 above.

---

## ❗ Troubleshooting

### Error: "Column 'loanId' already exists"
✅ **Good!** This means Migration 1 is already done. Skip to Migration 2.

### Error: "Invalid use of NULL value"
⚠️ Make sure to run the UPDATE statement before the ALTER TABLE in Migration 2.

### Error: "Unknown column 'loanId'"
❌ Migration 1 didn't complete. Run Migration 1 again.

---

## 🎉 What's Next?

After all migrations complete successfully:

1. ✅ Commit and push your code changes:
   ```bash
   git add .
   git commit -m "feat: Add 8 new features"
   git push origin main
   ```

2. ✅ Railway will automatically deploy the new code

3. ✅ Test the deployment using the test script:
   ```bash
   ADMIN_TOKEN=your_token node test-deployment.js
   ```

---

## 📞 Need Help?

If you get stuck:
1. Check Railway logs: `railway logs --tail`
2. Verify environment variables are set
3. Review the full guide: `RAILWAY_DEPLOYMENT_GUIDE.md`
