# New Features Implementation Summary

This document outlines all the new features that have been added to the Core Q Capital Loan Management System.

## Table of Contents
1. [Loan Agreement Workflow Changes](#1-loan-agreement-workflow-changes)
2. [SMS Notifications on Loan Approval](#2-sms-notifications-on-loan-approval)
3. [Interest Rate Editing for Large Loans](#3-interest-rate-editing-for-large-loans)
4. [Optional Date Range Filters for Reports](#4-optional-date-range-filters-for-reports)
5. [Unique Loan IDs](#5-unique-loan-ids)
6. [Predefined Expense Categories](#6-predefined-expense-categories)
7. [Collateral Sold/Not Sold Status](#7-collateral-soldnot-sold-status)
8. [Enhanced Loan Agreement Template](#8-enhanced-loan-agreement-template)

---

## 1. Loan Agreement Workflow Changes

### What Changed
- **Removed** the requirement for borrowers to upload signed loan agreements
- **New Default Status**: Loans now start in `pending_approval` state instead of `pending_upload`
- Loans are visible to employees/admins immediately after creation

### Impact
- Streamlined workflow - no waiting for document uploads
- Faster loan processing
- Admin can approve loans directly from the pending queue

### Database Changes
```sql
-- File: backend/migrations/update_loan_agreement_status.sql
ALTER TABLE loans MODIFY COLUMN agreementStatus DEFAULT 'pending_approval';
```

---

## 2. SMS Notifications on Loan Approval

### What Changed
When an admin approves a loan, **two SMS messages** are automatically sent to the borrower:

**SMS 1 - Approval Notification:**
```
CORE Q CAPITAL: Dear [Name], Your loan of KSH [amount] has been approved! Due date: [date]. Total repayment: KSH [total].
```

**SMS 2 - Payment Instructions:**
```
CORE Q CAPITAL: Dear [Name], Payment Details - Paybill: 522533, Account: 7862638. Please pay on or before [date]. Thank you for choosing Core Q Capital.
```

### Files Modified
- `backend/routes/loanAgreement.js` - Added SMS sending logic to approval endpoint

### API Endpoint
- `POST /api/loan-agreements/:loanId/approve` (Admin only)

---

## 3. Interest Rate Editing for Large Loans

### What Changed
- **NEW ENDPOINT**: Admin can now edit interest rates for loans above KSH 50,000
- Automatic recalculation of total amount due
- Marks loan as "negotiable" when custom rate is applied

### Business Rules
- Only loans **above KSH 50,000** can have custom interest rates
- Only **Admin users** can modify interest rates
- System validates that new rate is between 0-100%

### API Endpoint
```
PATCH /api/loans/:id/interest-rate
```

**Request Body:**
```json
{
  "interestRate": 25.5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Interest rate updated successfully",
  "loan": { ... },
  "calculation": {
    "principal": 60000,
    "newInterestRate": 25.5,
    "interestAmount": "15300.00",
    "totalAmount": "75300.00"
  }
}
```

### Files Modified
- `backend/controllers/loanController.js` - Added `updateInterestRate()` function
- `backend/routes/loan.js` - Added new route

---

## 4. Optional Date Range Filters for Reports

### What Changed
All **8 reports** now support optional date range filtering via query parameters.

### Affected Reports
1. ✅ Loans Issued Report - `GET /api/reports/loans-issued?startDate=2026-01-01&endDate=2026-01-31`
2. ✅ Loan Status Report - `GET /api/reports/loan-status?startDate=2026-01-01&endDate=2026-01-31`
3. ✅ Defaulters Report - `GET /api/reports/defaulters?startDate=2026-01-01&endDate=2026-01-31`
4. ✅ Defaulted Items Report - `GET /api/reports/defaulted-items?startDate=2026-01-01&endDate=2026-01-31`
5. ✅ Balances Report - `GET /api/reports/balances?startDate=2026-01-01&endDate=2026-01-31`
6. ✅ Not Yet Paid Report - `GET /api/reports/not-yet-paid?startDate=2026-01-01&endDate=2026-01-31`
7. ✅ Expenses Report - `GET /api/reports/expenses?startDate=2026-01-01&endDate=2026-01-31`
8. ✅ Profit & Loss Report - `GET /api/reports/profit-loss?startDate=2026-01-01&endDate=2026-01-31`

### Query Parameters (All Optional)
- `startDate` - Filter from this date (format: YYYY-MM-DD)
- `endDate` - Filter to this date (format: YYYY-MM-DD)

### Response Format
All reports now include a `period` field:
```json
{
  "report": "Loans Issued Report",
  "period": "2026-01-01 to 2026-01-31",
  ...
}
```

If no dates provided: `"period": "All time"`

### Files Modified
- `backend/controllers/reportController.js` - Updated all 8 report functions

---

## 5. Unique Loan IDs

### What Changed
- **NEW FIELD**: `loanId` added to loans table
- **Format**: `CQC-YYYY-NNNN` (e.g., `CQC-2026-0001`)
- Auto-generated for all new loans
- Sequential numbering resets each year

### Implementation
```javascript
// Example: First loan of 2026
loanId: "CQC-2026-0001"

// 50th loan of 2026
loanId: "CQC-2026-0050"
```

### Where Loan IDs Appear
1. **Loan Agreement PDF** - Top left corner of first page (large, bold)
2. **Email Subject** - "Your Loan Agreement - Core Q Capital (CQC-2026-0001)"
3. **Email Body** - Listed in loan details section
4. **API Responses** - Included in all loan objects

### Database Changes
```sql
-- File: backend/migrations/add_loan_id_field.sql
ALTER TABLE loans ADD COLUMN loanId VARCHAR(50) UNIQUE;
CREATE INDEX idx_loans_loanId ON loans(loanId);
```

### Files Modified
- `backend/models/Loan.js` - Added loanId field
- `backend/controllers/loanController.js` - Added `generateUniqueLoanId()` function
- `backend/services/loanAgreementService.js` - Display loan ID in PDF and email

---

## 6. Predefined Expense Categories

### What Changed
- **ENUM Field**: Expense categories are now restricted to predefined values
- **NEW ENDPOINT**: Get list of available categories
- **Validation**: Backend rejects invalid categories

### Predefined Categories
1. **Rent** - Office/premises rent expenses
2. **Salary** - Employee salaries and wages
3. **Printing** - Document printing costs
4. **Others** - All other expenses

### API Endpoints

**Get Categories:**
```
GET /api/expenses/categories
```

**Response:**
```json
{
  "categories": ["Rent", "Salary", "Printing", "Others"]
}
```

**Create Expense (with validation):**
```
POST /api/expenses
```

**Request Body:**
```json
{
  "category": "Rent",
  "name": "Office rent for January",
  "amount": 50000,
  "date": "2026-01-01"
}
```

**Error Response (invalid category):**
```json
{
  "error": "Invalid category",
  "message": "Category must be one of: Rent, Salary, Printing, Others"
}
```

### Database Changes
```sql
-- File: backend/migrations/update_expense_categories.sql
ALTER TABLE expenses
MODIFY COLUMN category ENUM('Rent', 'Salary', 'Printing', 'Others') NOT NULL;
```

### Files Modified
- `backend/models/Expense.js` - Changed category to ENUM, exported `CATEGORIES` constant
- `backend/controllers/expenseController.js` - Added validation and `getExpenseCategories()` function
- `backend/routes/expense.js` - Added `/categories` route

---

## 7. Collateral Sold/Not Sold Status

### What Changed
- **NEW ENDPOINTS**: Mark defaulted collateral as "Sold" or "Not Sold"
- **Status Tracking**: Records sold price and sold date
- **Editable**: Admin can revert sold status if needed

### Business Rules
- Only **seized/defaulted** collateral can be marked as sold
- Only **Admin users** can change sold status
- Requires sold price when marking as sold
- Cannot mark already-sold items as sold again

### API Endpoints

**Mark as Sold:**
```
POST /api/collaterals/:id/mark-sold
```

**Request Body:**
```json
{
  "soldPrice": 25000,
  "soldDate": "2026-01-15"  // Optional, defaults to today
}
```

**Response:**
```json
{
  "success": true,
  "message": "Collateral marked as sold successfully",
  "collateral": {
    "id": 123,
    "isSold": true,
    "soldPrice": 25000,
    "soldDate": "2026-01-15",
    "status": "sold",
    ...
  }
}
```

**Mark as Not Sold (Revert):**
```
POST /api/collaterals/:id/mark-not-sold
```

**Response:**
```json
{
  "success": true,
  "message": "Collateral marked as not sold",
  "collateral": {
    "id": 123,
    "isSold": false,
    "soldPrice": null,
    "soldDate": null,
    "status": "seized",
    ...
  }
}
```

### Impact on Reports
- **Defaulted Items Report**: Automatically separates Unsold vs Sold collateral
- **Profit & Loss Report**: Includes revenue from sold collateral in calculations

### Files Modified
- `backend/controllers/collateralController.js` - Added `markCollateralAsSold()` and `markCollateralAsNotSold()`
- `backend/routes/collateral.js` - Added two new routes

---

## 8. Enhanced Loan Agreement Template

### What Changed
- **Added Loan ID** - Displayed prominently on page 1
- **Enhanced Signatures Section** - Page 4 now includes:
  - Directors' signature lines
  - Advocate certification section with date
  - Borrower signature section
  - Witness signature (Fidelis Simati)
- **NEW PAGE 5**: Statutory Declaration
  - Full statutory declaration form
  - Commissioner of Oaths signature section

### Document Structure
**Page 1**: Cover page with Loan ID, company info, borrower details
**Page 2**: Agreement details (loan terms, collateral, credit advance)
**Page 3**: Terms & conditions (breach, notices, dispute resolution, etc.)
**Page 4**: Signatures (Directors, Advocate, Borrower, Witness)
**Page 5**: Statutory Declaration (Borrower oath, Commissioner certification)

### New Signature Sections

**Page 4 - Advocate Certification:**
```
I CERTIFY that Simati and Mukonzo appeared before me on [date] and being
identified by [BORROWER NAME] being known to me acknowledged
the above signature or mark to be theirs and they had freely and voluntarily
executed this Agreement and understood its contents

Signed ……………………………………
        ADVOCATE
```

**Page 5 - Statutory Declaration:**
```
I... [BORROWER NAME]... Of ID Number... [ID]...,
In the Republic of Kenya, MAKE OATH and declare as follows:

1. THAT, I am an adult of sound mind and hence competent to swear this statutory declaration.
2. THAT, I do solemnly and sincerely declare that the particulars contained herein are true to the best of my knowledge.
3. THAT, I declare that the collateral herein is mine and the borrower is liable whatsoever for any undertaking contrary to the agreement.
4. THAT, I make this declaration conscientiously believing the same to be true and in accordance with the Oaths and Statutory Declarations Act, (Chapter 15 of the Laws of Kenya)

DECLARED AT NAIROBI by the said
...
This day of ………………[DATE]………………….

BEFORE ME:                             ) ……………………………
COMMISSIONER OF OATHS        )
```

### Files Modified
- `backend/services/loanAgreementService.js` - Complete PDF template rewrite

---

## Database Migration Guide

### Prerequisites
- Backup your database before running migrations
- Ensure MySQL user has ALTER TABLE privileges

### Migration Files Location
```
backend/migrations/
├── add_loan_id_field.sql
├── update_expense_categories.sql
└── update_loan_agreement_status.sql
```

### Running Migrations

**Step 1: Add Loan ID Field**
```bash
mysql -u your_user -p coreq_loans < backend/migrations/add_loan_id_field.sql
```

**Step 2: Update Expense Categories**
```bash
# First, check existing categories
mysql -u your_user -p coreq_loans -e "SELECT DISTINCT category FROM expenses;"

# Then run migration
mysql -u your_user -p coreq_loans < backend/migrations/update_expense_categories.sql
```

**Step 3: Update Loan Agreement Status**
```bash
mysql -u your_user -p coreq_loans < backend/migrations/update_loan_agreement_status.sql
```

### Post-Migration Tasks

**Generate Loan IDs for Existing Loans (Optional):**
```sql
UPDATE loans
SET loanId = CONCAT('CQC-', YEAR(dateIssued), '-', LPAD(id, 4, '0'))
WHERE loanId IS NULL;
```

---

## Testing Checklist

### Feature 1: Loan Agreement Workflow
- [ ] Create new loan - verify it starts with `agreementStatus = 'pending_approval'`
- [ ] Check loan list shows newly created loans immediately
- [ ] Admin can approve loan without requiring signed document upload

### Feature 2: SMS Notifications
- [ ] Admin approves loan
- [ ] Verify borrower receives 2 SMS messages
- [ ] Check SMS content includes loan amount, due date, and payment details

### Feature 3: Interest Rate Editing
- [ ] Create loan > KSH 50,000
- [ ] Admin updates interest rate via `PATCH /api/loans/:id/interest-rate`
- [ ] Verify total amount recalculated correctly
- [ ] Verify loan marked as `isNegotiable: true`
- [ ] Try updating loan < KSH 50,000 - should fail
- [ ] Try as non-admin user - should fail

### Feature 4: Report Date Filters
- [ ] Test each of 8 reports with date range parameters
- [ ] Test with only `startDate`
- [ ] Test with only `endDate`
- [ ] Test with no dates (should show "All time")
- [ ] Verify `period` field in response

### Feature 5: Unique Loan IDs
- [ ] Create multiple loans - verify sequential IDs
- [ ] Check loan ID format: `CQC-YYYY-NNNN`
- [ ] Verify loan ID appears in PDF (page 1, top left)
- [ ] Verify loan ID in email subject and body

### Feature 6: Expense Categories
- [ ] GET `/api/expenses/categories` - verify returns 4 categories
- [ ] Create expense with valid category - should succeed
- [ ] Create expense with invalid category - should fail with error
- [ ] Check expense dropdown in frontend shows 4 options

### Feature 7: Collateral Sold Status
- [ ] Mark seized collateral as sold with price
- [ ] Verify `isSold = true`, status changed to "sold"
- [ ] Try marking non-seized collateral as sold - should fail
- [ ] Mark as not sold - verify reverts to "seized"
- [ ] Check Defaulted Items Report separates sold/unsold

### Feature 8: Loan Agreement Template
- [ ] Generate loan agreement PDF
- [ ] Verify 5 pages total
- [ ] Check page 1 has loan ID at top
- [ ] Check page 4 has all signature sections
- [ ] Check page 5 has statutory declaration
- [ ] Verify borrower name and ID appear correctly throughout

---

## API Summary

### New Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/api/loans/:id/interest-rate` | Admin | Update interest rate for loans > 50k |
| GET | `/api/expenses/categories` | Auth | Get predefined expense categories |
| POST | `/api/collaterals/:id/mark-sold` | Admin | Mark collateral as sold |
| POST | `/api/collaterals/:id/mark-not-sold` | Admin | Revert sold status |

### Modified Endpoints

| Method | Endpoint | Changes |
|--------|----------|---------|
| POST | `/api/loan-agreements/:loanId/approve` | Now sends 2 SMS to borrower |
| GET | `/api/reports/*` (all 8) | Added optional `startDate` and `endDate` query params |
| POST | `/api/loans` | Now generates unique `loanId` |
| POST | `/api/expenses` | Now validates category against predefined list |

---

## Environment Variables

No new environment variables required. Existing SMS integration uses:
- `AFRICASTALKING_USERNAME`
- `AFRICASTALKING_API_KEY`
- `AFRICASTALKING_SENDER_ID` (optional, defaults to "COREQCAP")

---

## Troubleshooting

### Issue: Loan IDs not generating
**Solution**: Check if migration was run. Manually add field if needed:
```sql
ALTER TABLE loans ADD COLUMN loanId VARCHAR(50) UNIQUE;
```

### Issue: SMS not sending
**Check**:
1. Africa's Talking credentials in `.env`
2. Phone number format (must be +254xxxxxxxxx)
3. Check console logs for SMS errors

### Issue: Expense category validation failing
**Solution**: Run migration to update existing categories:
```sql
UPDATE expenses SET category = 'Others'
WHERE category NOT IN ('Rent', 'Salary', 'Printing', 'Others');
```

### Issue: PDF generation errors
**Check**: Ensure PDFKit is installed:
```bash
npm install pdfkit
```

---

## Support

For issues or questions:
1. Check backend console logs
2. Review migration files
3. Ensure all database changes were applied
4. Test API endpoints using Postman or similar tool

---

**Document Version**: 1.0
**Last Updated**: January 8, 2026
**Author**: Claude (AI Assistant)
