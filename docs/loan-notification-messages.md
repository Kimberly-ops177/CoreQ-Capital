# Loan Repayment Email Notification Messages

## Example Scenario
- **Principal Balance Due:** KSH 1,000.00
- **Due Date:** March 15, 2026
- **Grace Period:** 7 days after due date (March 16-22)
- **Daily Penalty:** 3% of principal (KSH 30.00 per day)

---

## Penalty Calculation Table

| Day | Date | Days Late | Penalty Added | Cumulative Penalty | Total Amount Due |
|-----|------|-----------|---------------|-------------------|------------------|
| Due Date | Mar 15 | 0 | KSH 0 | KSH 0 | KSH 1,000.00 |
| Grace Day 1 | Mar 16 | 1 | KSH 30.00 | KSH 30.00 | KSH 1,030.00 |
| Grace Day 2 | Mar 17 | 2 | KSH 30.00 | KSH 60.00 | KSH 1,060.00 |
| Grace Day 3 | Mar 18 | 3 | KSH 30.00 | KSH 90.00 | KSH 1,090.00 |
| Grace Day 4 | Mar 19 | 4 | KSH 30.00 | KSH 120.00 | KSH 1,120.00 |
| Grace Day 5 | Mar 20 | 5 | KSH 30.00 | KSH 150.00 | KSH 1,150.00 |
| Grace Day 6 | Mar 21 | 6 | KSH 30.00 | KSH 180.00 | KSH 1,180.00 |
| Grace Day 7 | Mar 22 | 7 | KSH 30.00 | KSH 210.00 | KSH 1,210.00 |

---

## Email Notifications

### 1. Day Before Due Date (March 14, 2026)

**Subject:** Loan Repayment Reminder - Payment Due Tomorrow

**Body:**
```
Dear {BorrowerName},

We hope this message finds you well.

This is a kind reminder from Core Capital that your loan repayment of KES {Amount} is due on {DueDate}. We kindly request you to make the payment on or before the due date to avoid any late payment charges or penalties.

Payment Details:
M-Pesa Paybill: 522533
Account Number: 7862638

For any inquiries or assistance, feel free to contact us at 0797637074 / coreqcapital@gmail.com.

Thank you for choosing Core Capital. We appreciate your continued partnership.

Kind regards,
Core Q Capital
0797637074
```

---

### 2. Grace Period Day 1 (March 16, 2026)

**Subject:** NOTICE: Loan Overdue - Penalty Applied

**Body:**
```
Core Q Capital: NOTICE: Your loan is overdue and a penalty of KES {PenaltyAmount} has been added. Total due: KES {TotalAmount}. Please settle immediately via payment details:

M-Pesa Paybill: 522533
Account Number: 7862638

Contact: 0797637074 / coreqcapital@gmail.com to avoid further action.
```

**Example with values:**
```
Core Q Capital: NOTICE: Your loan is overdue and a penalty of KES 30.00 has been added. Total due: KES 1,030.00. Please settle immediately via payment details:

M-Pesa Paybill: 522533
Account Number: 7862638

Contact: 0797637074 / coreqcapital@gmail.com to avoid further action.
```

---

### 3. Grace Period Day 2 (March 17, 2026)

**Subject:** NOTICE: Loan Overdue - Penalty Applied

**Body:**
```
Core Q Capital: NOTICE: Your loan is overdue and a penalty of KES {PenaltyAmount} has been added. Total due: KES {TotalAmount}. Please settle immediately via payment details:

M-Pesa Paybill: 522533
Account Number: 7862638

Contact: 0797637074 / coreqcapital@gmail.com to avoid further action.
```

**Example with values:**
```
Core Q Capital: NOTICE: Your loan is overdue and a penalty of KES 60.00 has been added. Total due: KES 1,060.00. Please settle immediately via payment details:

M-Pesa Paybill: 522533
Account Number: 7862638

Contact: 0797637074 / coreqcapital@gmail.com to avoid further action.
```

---

### 4. Grace Period Day 3 (March 18, 2026)

**Subject:** NOTICE: Loan Overdue - Penalty Applied

**Body:**
```
Core Q Capital: NOTICE: Your loan is overdue and a penalty of KES {PenaltyAmount} has been added. Total due: KES {TotalAmount}. Please settle immediately via payment details:

M-Pesa Paybill: 522533
Account Number: 7862638

Contact: 0797637074 / coreqcapital@gmail.com to avoid further action.
```

**Example with values:**
```
Core Q Capital: NOTICE: Your loan is overdue and a penalty of KES 90.00 has been added. Total due: KES 1,090.00. Please settle immediately via payment details:

M-Pesa Paybill: 522533
Account Number: 7862638

Contact: 0797637074 / coreqcapital@gmail.com to avoid further action.
```

---

### 5. Grace Period Day 4 (March 19, 2026)

**Subject:** NOTICE: Loan Overdue - Penalty Applied

**Body:**
```
Core Q Capital: NOTICE: Your loan is overdue and a penalty of KES {PenaltyAmount} has been added. Total due: KES {TotalAmount}. Please settle immediately via payment details:

M-Pesa Paybill: 522533
Account Number: 7862638

Contact: 0797637074 / coreqcapital@gmail.com to avoid further action.
```

**Example with values:**
```
Core Q Capital: NOTICE: Your loan is overdue and a penalty of KES 120.00 has been added. Total due: KES 1,120.00. Please settle immediately via payment details:

M-Pesa Paybill: 522533
Account Number: 7862638

Contact: 0797637074 / coreqcapital@gmail.com to avoid further action.
```

---

### 6. Grace Period Day 5 (March 20, 2026)

**Subject:** NOTICE: Loan Overdue - Penalty Applied

**Body:**
```
Core Q Capital: NOTICE: Your loan is overdue and a penalty of KES {PenaltyAmount} has been added. Total due: KES {TotalAmount}. Please settle immediately via payment details:

M-Pesa Paybill: 522533
Account Number: 7862638

Contact: 0797637074 / coreqcapital@gmail.com to avoid further action.
```

**Example with values:**
```
Core Q Capital: NOTICE: Your loan is overdue and a penalty of KES 150.00 has been added. Total due: KES 1,150.00. Please settle immediately via payment details:

M-Pesa Paybill: 522533
Account Number: 7862638

Contact: 0797637074 / coreqcapital@gmail.com to avoid further action.
```

---

### 7. Grace Period Day 6 (March 21, 2026)

**Subject:** NOTICE: Loan Overdue - Penalty Applied

**Body:**
```
Core Q Capital: NOTICE: Your loan is overdue and a penalty of KES {PenaltyAmount} has been added. Total due: KES {TotalAmount}. Please settle immediately via payment details:

M-Pesa Paybill: 522533
Account Number: 7862638

Contact: 0797637074 / coreqcapital@gmail.com to avoid further action.
```

**Example with values:**
```
Core Q Capital: NOTICE: Your loan is overdue and a penalty of KES 180.00 has been added. Total due: KES 1,180.00. Please settle immediately via payment details:

M-Pesa Paybill: 522533
Account Number: 7862638

Contact: 0797637074 / coreqcapital@gmail.com to avoid further action.
```

---

### 8. Grace Period Day 7 - DEFAULT NOTICE (March 22, 2026)

**Subject:** NOTICE OF DEFAULT - Collateral Recovery Proceedings

**Body:**
```
Dear {BorrowerName},

We refer to your loan agreement with Core Q Capital and our previous notices regarding your outstanding loan balance.

This is to formally notify you that the grace period has elapsed and your account remains in default. As per the terms and conditions of your loan agreement, Core Capital will now proceed with the recovery and/or disposal of the pledged collateral item due to your failure to clear the loan arrears.

Loan Details:
- Loan Reference: CQC-{LoanId}
- Outstanding Balance: KES {TotalAmount}
- Collateral Item: {CollateralDescription}

You are hereby advised to settle the full outstanding amount immediately to avoid further recovery actions. If this notice has been issued in error or you wish to discuss the matter, contact us without delay at 0797637074 / coreqcapital@gmail.com.

Sincerely,
Core Q Capital
0797637074
```

**Example with values:**
```
Dear John Doe,

We refer to your loan agreement with Core Q Capital and our previous notices regarding your outstanding loan balance.

This is to formally notify you that the grace period has elapsed and your account remains in default. As per the terms and conditions of your loan agreement, Core Capital will now proceed with the recovery and/or disposal of the pledged collateral item due to your failure to clear the loan arrears.

Loan Details:
- Loan Reference: CQC-1234
- Outstanding Balance: KES 1,210.00
- Collateral Item: Samsung Galaxy S23 Ultra (IMEI: 123456789012345)

You are hereby advised to settle the full outstanding amount immediately to avoid further recovery actions. If this notice has been issued in error or you wish to discuss the matter, contact us without delay at 0797637074 / coreqcapital@gmail.com.

Sincerely,
Core Q Capital
0797637074
```

---

## Summary

| Email Type | When Sent | Purpose |
|------------|-----------|---------|
| Day Before | 1 day before due | Friendly payment reminder |
| Grace Days 1-6 | Days 1-6 after due | Overdue notice with penalty amount |
| Grace Day 7 | Day 7 after due | Formal default notice with collateral recovery warning |

---

## Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{BorrowerName}` | Borrower's full name | John Doe |
| `{LoanId}` | Unique loan identifier | 1234 |
| `{Amount}` | Original loan amount due | KES 1,000.00 |
| `{DueDate}` | Original payment due date | March 15, 2026 |
| `{PenaltyAmount}` | Cumulative penalties to date | KES 90.00 |
| `{TotalAmount}` | Principal + cumulative penalties | KES 1,090.00 |
| `{CollateralDescription}` | Description of pledged collateral | Samsung Galaxy S23 Ultra (IMEI: 123456789012345) |

---

## Suggested Loan Reference Format

For the Loan Reference field, I suggest using: **CQC-{LoanId}**

Examples:
- CQC-1234
- CQC-5678
- CQC-9012

This format:
- **CQC** = Core Q Capital (company identifier)
- **{LoanId}** = The unique loan ID from the system

This makes it easy to identify and track loans while maintaining a professional appearance.
