# 🚂 Railway Deployment Guide - Core Q Capital

## Your Railway Setup

- **Project**: adventurous-adaptation (production)
- **Backend Service**: CoreQ-Capital
  - Domain: `api.coreqcapital.com`
  - Port: 8080
  - Status: ✅ Online
- **Frontend Service**: delightful-fascination
  - Domain: `coreqcapital.com`
  - Port: 80
  - Status: ✅ Online
- **Database**: MySQL
  - Status: ✅ Online
  - Tables: 12 (borrowers, branches, collaterals, expenses, loans, payments, settings, staff_roles, users, etc.)

---

## 🎯 Quick Deployment Steps

### Step 1: Run Database Migrations

You have **3 options** to run migrations on your Railway MySQL database:

#### Option A: Using Railway's Query Console (EASIEST - Recommended)

1. **Open MySQL Service in Railway**
   - Go to: https://railway.com/project/b902f85f-5987-45d5-a3ec-028127f9b0d7
   - Click on "MySQL" service
   - Click on "Database" tab
   - Click "Query" button

2. **Run Migration 1: Add Loan ID Field**
   ```sql
   -- Check if column already exists first
   SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
   AND table_name = 'loans'
   AND column_name = 'loanId';

   -- If it returns 0, run this migration
   ALTER TABLE loans ADD COLUMN loanId VARCHAR(50) UNIQUE AFTER id;
   CREATE INDEX idx_loans_loanId ON loans(loanId);

   -- Verify it was added
   DESCRIBE loans;
   ```

3. **Run Migration 2: Update Expense Categories**
   ```sql
   -- First, check what categories currently exist
   SELECT DISTINCT category FROM expenses;

   -- Update any non-standard categories to 'Others'
   UPDATE expenses SET category = 'Others'
   WHERE category NOT IN ('Rent', 'Salary', 'Printing', 'Others');

   -- Modify the column to use ENUM
   ALTER TABLE expenses
   MODIFY COLUMN category ENUM('Rent', 'Salary', 'Printing', 'Others') NOT NULL;

   -- Verify the change
   SHOW COLUMNS FROM expenses LIKE 'category';
   ```

4. **Run Migration 3: Update Loan Agreement Status**
   ```sql
   -- Update existing loans that are still in pending_upload status
   UPDATE loans
   SET agreementStatus = 'pending_approval'
   WHERE agreementStatus = 'pending_upload';

   -- Modify the default value for the column
   ALTER TABLE loans
   MODIFY COLUMN agreementStatus ENUM('pending_upload', 'pending_approval', 'approved', 'rejected')
   DEFAULT 'pending_approval';

   -- Verify the change
   SELECT column_default FROM information_schema.columns
   WHERE table_name = 'loans' AND column_name = 'agreementStatus';
   ```

5. **Generate Loan IDs for Existing Loans (Optional)**
   ```sql
   -- Only run this if you want to add loan IDs to existing loans
   UPDATE loans
   SET loanId = CONCAT('CQC-', YEAR(dateIssued), '-', LPAD(id, 4, '0'))
   WHERE loanId IS NULL;

   -- Verify loan IDs were generated
   SELECT id, loanId, dateIssued FROM loans LIMIT 10;
   ```

#### Option B: Using Railway CLI

```bash
# 1. Install Railway CLI (if not installed)
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Link to your project
railway link b902f85f-5987-45d5-a3ec-028127f9b0d7

# 4. Connect to MySQL database
railway connect MySQL

# Once connected, you can run SQL commands directly
# Or source the migration files:
\. backend/migrations/add_loan_id_field.sql
\. backend/migrations/update_expense_categories.sql
\. backend/migrations/update_loan_agreement_status.sql
```

#### Option C: Create an Automated Migration Script

I'll create this for you below.

---

### Step 2: Deploy Code Changes

Railway automatically deploys from GitHub when you push:

```bash
# 1. Ensure all changes are committed
git status

# 2. Stage all changes
git add .

# 3. Commit with clear message
git commit -m "feat: Add 8 new features

- Add unique loan IDs (CQC-YYYY-NNNN format)
- Add SMS notifications on loan approval (2 messages)
- Add interest rate editing for loans above 50k
- Add optional date range filters to all 8 reports
- Add predefined expense categories (Rent, Salary, Printing, Others)
- Add sold/not sold status for collateral with tracking
- Remove signed document upload requirement
- Enhance loan agreement template with signatures"

# 4. Push to your repository
# Replace 'main' with your branch name if different
git push origin main
```

**Railway will automatically:**
- ✅ Detect the push
- ✅ Build the backend (CoreQ-Capital service)
- ✅ Deploy with zero downtime
- ✅ Keep the old version running until new one is healthy

**Check deployment progress:**
- Go to: https://railway.com/project/b902f85f-5987-45d5-a3ec-028127f9b0d7
- Click "CoreQ-Capital" service
- Click "Deployments" tab
- Watch the build logs

---

### Step 3: Verify Migrations Worked

After migrations, verify in Railway's Query console:

```sql
-- Check 1: Verify loanId column exists
SHOW COLUMNS FROM loans LIKE 'loanId';

-- Check 2: Verify expense categories are ENUM
SHOW COLUMNS FROM expenses LIKE 'category';

-- Check 3: Verify loan agreement default status
SELECT column_default FROM information_schema.columns
WHERE table_name = 'loans' AND column_name = 'agreementStatus';

-- Check 4: Count loans with loan IDs
SELECT
  COUNT(*) as total_loans,
  COUNT(loanId) as loans_with_id,
  COUNT(*) - COUNT(loanId) as loans_without_id
FROM loans;
```

**Expected Results:**
- ✅ `loanId` column: VARCHAR(50), NULL, UNI
- ✅ `category` column: enum('Rent','Salary','Printing','Others')
- ✅ `agreementStatus` default: 'pending_approval'

---

## 🧪 Testing Your Deployed Application

### Test 1: Backend Health Check

```bash
# Check if backend is running
curl https://api.coreqcapital.com/api/health

# Expected: 200 OK with health status
```

### Test 2: Get Expense Categories (New Feature)

```bash
# Test new expense categories endpoint
curl https://api.coreqcapital.com/api/expenses/categories \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response:
# {
#   "categories": ["Rent", "Salary", "Printing", "Others"]
# }
```

### Test 3: Create a New Loan (Should Generate Loan ID)

**Via Frontend:**
1. Go to: https://coreqcapital.com
2. Login as admin/employee
3. Navigate to "Create Loan"
4. Fill in loan details
5. Submit
6. **Check response** - should include `loanId: "CQC-2026-XXXX"`

**Via API:**
```bash
curl -X POST https://api.coreqcapital.com/api/loans \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "borrowerId": 1,
    "collateralId": 1,
    "amountIssued": 10000,
    "loanPeriod": 1
  }'

# Check response includes:
# - loanId: "CQC-2026-0001" (or similar)
# - agreementStatus: "pending_approval"
```

### Test 4: Approve Loan (Should Send SMS)

**IMPORTANT**: This will send real SMS to the borrower's phone!

```bash
curl -X POST https://api.coreqcapital.com/api/loan-agreements/1/approve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected:
# - Status 200
# - Response: { "success": true, "message": "Loan agreement approved successfully. SMS notifications sent to client." }
# - Borrower receives 2 SMS messages
```

### Test 5: Test Report Date Filters

```bash
# Test loans issued report with date range
curl "https://api.coreqcapital.com/api/reports/loans-issued?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check response includes:
# - "period": "2026-01-01 to 2026-01-31"
```

### Test 6: Update Interest Rate for Large Loan

```bash
# Create a loan above 50k first, then update its interest rate
curl -X PATCH https://api.coreqcapital.com/api/loans/1/interest-rate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interestRate": 22.5
  }'

# Expected:
# - Status 200
# - Updated interest rate and recalculated totalAmount
# - isNegotiable: true
```

### Test 7: Mark Collateral as Sold

```bash
curl -X POST https://api.coreqcapital.com/api/collaterals/1/mark-sold \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "soldPrice": 25000,
    "soldDate": "2026-01-15"
  }'

# Expected:
# - Status 200
# - isSold: true
# - status: "sold"
```

### Test 8: Create Expense with New Categories

```bash
# Test valid category
curl -X POST https://api.coreqcapital.com/api/expenses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Rent",
    "name": "Office rent for January",
    "amount": 50000,
    "date": "2026-01-01"
  }'

# Expected: Status 201 Created

# Test invalid category (should fail)
curl -X POST https://api.coreqcapital.com/api/expenses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "InvalidCategory",
    "name": "Test expense",
    "amount": 1000
  }'

# Expected: Status 400 with error message
```

---

## 📊 Monitoring Deployment

### Check Deployment Logs

**Option 1: Railway Dashboard**
1. Go to: https://railway.com/project/b902f85f-5987-45d5-a3ec-028127f9b0d7
2. Click "CoreQ-Capital" service
3. Click "Deployments" tab
4. Click latest deployment
5. View logs in real-time

**Option 2: Railway CLI**
```bash
# Watch logs in real-time
railway logs --tail

# Filter for specific service
railway logs --service CoreQ-Capital --tail

# Search for errors
railway logs | grep -i error
railway logs | grep -i "SMS"
railway logs | grep -i "loanId"
```

### Key Things to Monitor

**1. Startup Logs**
```
✅ "Server running on port 8080"
✅ "Database connected successfully"
✅ "Africa's Talking SMS service initialized"
```

**2. Feature Logs**
```
✅ "Generating loan agreement for loan X..."
✅ "Loan agreement generated and emailed successfully for loan X"
✅ "SMS notifications sent to [Borrower] for loan X"
```

**3. Error Logs to Watch For**
```
❌ "Column 'loanId' doesn't exist" → Migration not run
❌ "Invalid category" → Old expense categories need updating
❌ "SMS service not configured" → Check environment variables
```

---

## 🔧 Environment Variables Check

Verify these environment variables are set in Railway for CoreQ-Capital service:

**Required for SMS (Feature #2):**
- `AFRICASTALKING_USERNAME`
- `AFRICASTALKING_API_KEY`
- `AFRICASTALKING_SENDER_ID` (optional, defaults to "COREQCAP")

**Database Connection:**
- `MYSQL_HOST` or `DB_HOST`
- `MYSQL_USER` or `DB_USER`
- `MYSQL_PASSWORD` or `DB_PASSWORD`
- `MYSQL_DATABASE` or `DB_NAME`

**To check/add variables:**
1. Go to CoreQ-Capital service
2. Click "Variables" tab
3. Verify all required variables exist

---

## 🚨 Troubleshooting

### Issue: Deployment fails with "Column 'loanId' doesn't exist"

**Cause**: Migrations not run before code deployment

**Solution**:
```bash
# Option 1: Run migrations via Railway Query console (see Step 1)
# Option 2: Rollback deployment, run migrations, then redeploy
railway rollback
# Run migrations via Query console
git push origin main
```

### Issue: "Invalid category" errors when creating expenses

**Cause**: Migration 2 not run, or old expenses have non-standard categories

**Solution**:
```sql
-- In Railway Query console
UPDATE expenses SET category = 'Others'
WHERE category NOT IN ('Rent', 'Salary', 'Printing', 'Others');

ALTER TABLE expenses
MODIFY COLUMN category ENUM('Rent', 'Salary', 'Printing', 'Others') NOT NULL;
```

### Issue: SMS not sending

**Check**:
1. Environment variables are set (see above)
2. Phone numbers are in correct format (+254xxxxxxxxx)
3. Africa's Talking account has credits
4. Check logs: `railway logs | grep SMS`

**Test SMS service:**
```bash
# Check logs for SMS initialization
railway logs | grep "Africa's Talking"

# Should see: "✅ Africa's Talking SMS service initialized"
```

### Issue: Loans still showing "pending_upload" status

**Solution**: Run Migration 3
```sql
UPDATE loans
SET agreementStatus = 'pending_approval'
WHERE agreementStatus = 'pending_upload';
```

### Issue: Frontend not showing new features

**Cause**: Frontend may need to be updated to use new API endpoints

**Action**: The frontend changes are separate - focus on testing backend first

---

## 🔄 Rollback Plan

If something goes wrong:

### Quick Rollback (Code)
```bash
# Option 1: Via Railway Dashboard
# 1. Go to Deployments tab
# 2. Find last working deployment
# 3. Click "Redeploy"

# Option 2: Via CLI
railway rollback
```

### Database Rollback (Migrations)

**Only if absolutely necessary:**

```sql
-- Rollback Migration 1: Remove loanId
ALTER TABLE loans DROP COLUMN loanId;
DROP INDEX idx_loans_loanId ON loans;

-- Rollback Migration 2: Revert expense categories
ALTER TABLE expenses MODIFY COLUMN category VARCHAR(255) NOT NULL;

-- Rollback Migration 3: Revert loan agreement status
ALTER TABLE loans
MODIFY COLUMN agreementStatus ENUM('pending_upload', 'pending_approval', 'approved', 'rejected')
DEFAULT 'pending_upload';

UPDATE loans
SET agreementStatus = 'pending_upload'
WHERE agreementStatus = 'pending_approval';
```

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

### Database
- [ ] Backup database (Railway does this automatically, but verify)
- [ ] Tested all 3 migrations locally
- [ ] Verified SQL syntax is correct
- [ ] Checked that existing data won't break

### Code
- [ ] All changes committed and pushed
- [ ] No syntax errors in modified files
- [ ] Environment variables are set correctly
- [ ] Africa's Talking SMS credentials are valid

### Testing
- [ ] Tested loan creation locally
- [ ] Tested expense categories locally
- [ ] Tested reports with date filters locally
- [ ] Verified PDF generation works

### Communication
- [ ] Team notified of deployment
- [ ] Low-traffic deployment window chosen (if possible)
- [ ] Rollback plan documented

---

## 📝 Post-Deployment Testing Checklist

After deployment completes:

### Immediate Tests (5 minutes)
- [ ] Backend responds: `curl https://api.coreqcapital.com/api/health`
- [ ] Frontend loads: Visit https://coreqcapital.com
- [ ] Login works
- [ ] Database queries working (check Railway logs)

### Feature Tests (15 minutes)
- [ ] Create new loan → verify loanId generated
- [ ] Approve loan → verify SMS sent (check logs)
- [ ] Get expense categories → verify 4 categories returned
- [ ] Run report with date range → verify filter works
- [ ] Create expense with valid category → succeeds
- [ ] Create expense with invalid category → fails properly
- [ ] Update interest rate for loan > 50k → succeeds
- [ ] Mark collateral as sold → updates correctly

### Database Verification (5 minutes)
- [ ] Run verification queries (see Step 3)
- [ ] Check that existing loans have data intact
- [ ] Verify new columns exist
- [ ] Check that no data was lost

---

## 🎉 Success Indicators

Your deployment is successful when:

✅ **Backend is running** - No errors in logs
✅ **New loans get loan IDs** - Format: CQC-2026-XXXX
✅ **SMS notifications work** - Borrowers receive 2 messages on approval
✅ **Expense categories work** - Only 4 categories accepted
✅ **Reports accept date filters** - All 8 reports work with optional dates
✅ **Interest rate editing works** - Loans > 50k can have custom rates
✅ **Collateral sold status works** - Can mark as sold/not sold
✅ **PDF generation works** - Loan agreements include loan ID and signatures
✅ **No errors in logs** - Clean deployment with no migration errors

---

## 📞 Need Help?

**Common Resources:**
- Railway Dashboard: https://railway.com/project/b902f85f-5987-45d5-a3ec-028127f9b0d7
- Backend URL: https://api.coreqcapital.com
- Frontend URL: https://coreqcapital.com
- Documentation: See `NEW_FEATURES.md` for feature details

**Quick Commands:**
```bash
# View logs
railway logs --tail

# Connect to database
railway connect MySQL

# Rollback deployment
railway rollback

# Check service status
railway status
```

---

**Ready to Deploy?** Start with Step 1 above! 🚀
