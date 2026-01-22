# Defaulted Items Sold Report - Data Workflow Guide

## Report Columns

The Defaulted Items Sold report contains the following columns:

| Column | Source | Description |
|--------|--------|-------------|
| **DEFAULTED DATE** | Loan.updatedAt | Date when loan status changed to 'defaulted' |
| **ITEM ID** | Collateral.id | Unique identifier for the collateral item |
| **NAME** | Borrower.fullName | Full name of the borrower |
| **ID NUMBER** | Borrower.idNumber | Borrower's ID/Passport number |
| **ITEM** | Collateral.itemName | Name/description of the collateral item |
| **MODEL NO** | Collateral.modelNumber | Model number of the item |
| **AMOUNT SOLD** | Collateral.soldPrice | Price at which the item was sold |
| **DATE SOLD** | Collateral.soldDate | Date when the item was sold |
| **PHONE NUMBER** | Borrower.phoneNumber | Borrower's contact number |
| **AMOUNT ISSUED** | Loan.amountIssued | Original loan principal amount |
| **AMOUNT PAYABLE** | Loan.totalAmount | Total amount due (principal + interest) |

---

## Workflow for Managing Defaulted Items

### Step 1: Loan Defaults (Automatic)

When a loan remains unpaid for 7 days after the due date, the system automatically:
1. Changes the loan status to `'defaulted'`
2. Updates the collateral status to `'seized'`
3. Sets `isSeized = true` on the collateral

**No manual action required** - this happens automatically via the loan status scheduler.

---

### Step 2: View Defaulted Items (Collaterals Tab)

To see all seized collateral items:

1. Navigate to **Collaterals** page
2. Items with status **"Seized"** (orange chip) are defaulted items not yet sold
3. These items correspond to the **"Defaulted Items Not Sold"** section in the report

---

### Step 3: Mark Collateral as Sold (Enhanced Dialog)

When a seized item is sold, an admin must record the sale using the "Mark as Sold" dialog:

#### How to Access:
1. Go to **Collaterals** page
2. Find the item with "Seized" status
3. Click the green **"$" (Sell)** button in the Actions column

#### Dialog Layout:

The "Mark as Sold" dialog contains three sections:

**Section 1: Borrower Details (Prefilled - Read Only)**
- Borrower Name
- ID Number
- Phone Number
- Item ID

**Section 2: Item Details (Prefilled - Read Only)**
- Item Name
- Model Number

**Section 3: Sale Details (User Must Enter/Confirm)**
- **Amount Issued (KES)** - Prefilled from loan, editable if needed
- **Amount Payable (KES)** - Prefilled from loan, editable if needed
- **Amount Sold For (KES)** - User must enter the actual sale price
- **Date Sold** - Defaults to today, user can change

#### Data Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARK AS SOLD DIALOG                          │
├─────────────────────────────────────────────────────────────────┤
│  BORROWER DETAILS (Prefilled from Borrower table)               │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ Borrower Name   │  │ ID Number       │  ← Auto-filled        │
│  │ [John Doe     ] │  │ [12345678     ] │                       │
│  └─────────────────┘  └─────────────────┘                       │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ Phone Number    │  │ Item ID         │  ← Auto-filled        │
│  │ [0712345678   ] │  │ [42           ] │                       │
│  └─────────────────┘  └─────────────────┘                       │
├─────────────────────────────────────────────────────────────────┤
│  ITEM DETAILS (Prefilled from Collateral table)                 │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ Item Name       │  │ Model Number    │  ← Auto-filled        │
│  │ [Samsung S23  ] │  │ [SM-S911B     ] │                       │
│  └─────────────────┘  └─────────────────┘                       │
├─────────────────────────────────────────────────────────────────┤
│  SALE DETAILS (User enters/confirms)                            │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ Amount Issued   │  │ Amount Payable  │  ← Prefilled from     │
│  │ [KES 10,000   ] │  │ [KES 12,000   ] │    Loan (editable)    │
│  └─────────────────┘  └─────────────────┘                       │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ Amount Sold For │  │ Date Sold       │  ← USER MUST ENTER    │
│  │ [KES 8,500    ] │  │ [2026-01-23   ] │                       │
│  └─────────────────┘  └─────────────────┘                       │
├─────────────────────────────────────────────────────────────────┤
│                    [Cancel]  [Confirm Sale]                     │
└─────────────────────────────────────────────────────────────────┘
```

---

### Step 4: What Happens After Confirming Sale

When the admin clicks "Confirm Sale":

1. **Collateral record is updated:**
   - `status` → `'sold'`
   - `isSold` → `true`
   - `soldPrice` → Amount entered
   - `soldDate` → Date entered

2. **The item now appears in:**
   - "Sold Defaulted Items" section of the Defaulted Items Report
   - With all columns populated from the linked records

---

### Step 5: Generate Report

1. Navigate to **Reports** page
2. Click **Generate** on "Defaulted Items Report"
3. The report shows two sections:
   - **Defaulted Items Not Sold**: Items seized but not yet sold
   - **Sold Defaulted Items**: Items that have been sold (with all columns populated)

---

## Data Entry Checklist

### Prefilled (No action needed):
- ✅ Borrower Name (from Borrower record)
- ✅ ID Number (from Borrower record)
- ✅ Phone Number (from Borrower record)
- ✅ Item ID (from Collateral record)
- ✅ Item Name (from Collateral record)
- ✅ Model Number (from Collateral record)
- ✅ Defaulted Date (from Loan record)

### Auto-filled but Editable:
- ⚡ Amount Issued (prefilled from Loan, can be edited)
- ⚡ Amount Payable (prefilled from Loan, can be edited)

### User Must Enter:
- ❗ **Amount Sold For** - The actual price the item sold for
- ❗ **Date Sold** - When the sale occurred (defaults to today)

---

## Summary of Collateral Statuses

| Status | Description | Visible on Collaterals Page | Can Mark as Sold |
|--------|-------------|----------------------------|------------------|
| **Held** | Active loan, collateral with lender | ✅ Yes | ❌ No |
| **Returned** | Loan paid, collateral returned | ❌ No (filtered out) | ❌ No |
| **Seized** | Loan defaulted, collateral seized | ✅ Yes | ✅ Yes (Admin only) |
| **Sold** | Seized collateral has been sold | ✅ Yes | ❌ No (already sold) |

---

## Reverting a Sale (Admin Only)

If a sale was recorded in error:

1. Go to **Collaterals** page
2. Find the sold item
3. Click **Edit** (pencil icon)
4. Change **Status** back to "Seized"
5. Click **Update**

Or via API:
```
POST /api/collaterals/:id/mark-not-sold
```

---

## Contact

For technical support or questions about the reporting system:
- Phone: 0797637074
- Email: coreqcapital@gmail.com
