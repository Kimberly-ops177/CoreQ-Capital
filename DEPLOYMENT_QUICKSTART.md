# 🚀 Quick Start Deployment Guide

## Your Railway URLs
- **Backend**: https://api.coreqcapital.com (CoreQ-Capital)
- **Frontend**: https://coreqcapital.com (delightful-fascination)
- **Database**: MySQL (via Railway)

---

## ⚡ 3-Step Deployment

### Step 1: Run Database Migrations (5 minutes)

**Option A: Railway Query Console (Easiest)**

1. Go to: https://railway.com/project/b902f85f-5987-45d5-a3ec-028127f9b0d7
2. Click "MySQL" → "Database" tab → "Query" button
3. Copy-paste and run these 3 SQL blocks:

**Migration 1:**
```sql
ALTER TABLE loans ADD COLUMN loanId VARCHAR(50) UNIQUE AFTER id;
CREATE INDEX idx_loans_loanId ON loans(loanId);
UPDATE loans SET loanId = CONCAT('CQC-', YEAR(dateIssued), '-', LPAD(id, 4, '0')) WHERE loanId IS NULL;
```

**Migration 2:**
```sql
UPDATE expenses SET category = 'Others' WHERE category NOT IN ('Rent', 'Salary', 'Printing', 'Others');
ALTER TABLE expenses MODIFY COLUMN category ENUM('Rent', 'Salary', 'Printing', 'Others') NOT NULL;
```

**Migration 3:**
```sql
UPDATE loans SET agreementStatus = 'pending_approval' WHERE agreementStatus = 'pending_upload';
ALTER TABLE loans MODIFY COLUMN agreementStatus ENUM('pending_upload', 'pending_approval', 'approved', 'rejected') DEFAULT 'pending_approval';
```

**Option B: Use Migration Script**
```bash
railway run node backend/migrate.js
```

---

### Step 2: Deploy Code (2 minutes)

```bash
# Commit and push changes
git add .
git commit -m "feat: Add 8 new features"
git push origin main
```

Railway will automatically deploy. Watch progress at:
https://railway.com/project/b902f85f-5987-45d5-a3ec-028127f9b0d7

---

### Step 3: Verify Deployment (3 minutes)

**Quick Check:**
```bash
# Test backend is up
curl https://api.coreqcapital.com/api/health

# Get expense categories (should return 4)
curl https://api.coreqcapital.com/api/expenses/categories \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Or run automated tests:**
```bash
npm install axios
ADMIN_TOKEN=your_token node test-deployment.js
```

---

## ✅ Success Checklist

After deployment, verify these:

- [ ] Backend responds: https://api.coreqcapital.com/api/health
- [ ] New endpoint works: GET /api/expenses/categories → Returns 4 categories
- [ ] Create a loan → Check response has `loanId: "CQC-2026-XXXX"`
- [ ] Reports accept dates: GET /api/reports/loans-issued?startDate=2026-01-01
- [ ] No errors in Railway logs

---

## 🎯 What's New

1. **Unique Loan IDs** - Format: CQC-2026-0001
2. **SMS on Approval** - 2 messages sent automatically
3. **Interest Rate Editing** - For loans above 50k (PATCH /loans/:id/interest-rate)
4. **Report Date Filters** - All 8 reports now accept startDate & endDate
5. **Expense Categories** - Only: Rent, Salary, Printing, Others
6. **Collateral Sold Status** - Track sold/not sold with price
7. **No Upload Required** - Loans start in "pending_approval"
8. **Enhanced PDF** - Loan agreement now has 5 pages with signatures

---

## 🆘 Quick Troubleshooting

**"Column 'loanId' doesn't exist"**
→ Run migrations (Step 1)

**"Invalid category" errors**
→ Run Migration 2 again

**SMS not sending**
→ Check Railway env vars: AFRICASTALKING_USERNAME, AFRICASTALKING_API_KEY

**Need rollback?**
→ Railway Dashboard → Deployments → Click previous version → Redeploy

---

## 📚 Full Documentation

- **Detailed Guide**: See `RAILWAY_DEPLOYMENT_GUIDE.md`
- **Feature Docs**: See `NEW_FEATURES.md`
- **API Changes**: See `NEW_FEATURES.md` → API Summary

---

## 🎉 You're Done!

After Step 3, your deployment is complete and all 8 new features are live!

**Test it:** Create a loan and check if it has a loan ID like `CQC-2026-0001` ✨
