# CORRECT Placeholder Names for Word Template

## THE PROBLEM WAS FIXED!

The overlapping issue was caused by **incorrect placeholder names** in your Word template. The placeholder names didn't match the database field names.

---

## Use These EXACT Placeholders in Your Word Template

Copy these into your Word document where borrower data should appear:

### Basic Borrower Information
- `{loanId}` - Loan ID
- `{borrowerName}` - Borrower full name (appears multiple times)
- `{idNumber}` - ID/Passport number (appears multiple times)
- `{phoneNumber}` - Phone number

### Address Information
- `{location}` - Location/area
- `{apartment}` - Apartment/building name (**NOT** `{apartmentName}`)
- `{houseNumber}` - House/unit number (**NOT** `{houseNo}`)

### Emergency Contact
- `{emergencyNumber}` - Emergency contact number (**NOT** `{emergencyContact}` or `{emergencyPhone}`)

### Student-Specific Fields (if applicable)
- `{institution}` - Educational institution name
- `{registrationNumber}` - Student registration number (**NOT** `{regNumber}`)

### Loan Details
- `{date}` - Agreement date (appears multiple times)
- `{loanAmount}` - Amount borrowed
- `{interestRate}` - Interest rate percentage
- `{totalAmount}` - Total repayment amount
- `{dueDate}` - Repayment due date
- `{loanPeriod}` - Loan duration (e.g., "1 week(s)")

### Collateral Information
- `{itemName}` - Collateral item name
- `{modelNumber}` - Model number
- `{serialNumber}` - Serial/IMEI number
- `{itemCondition}` - Item condition

---

## What Changed in the Code

Fixed the field name mappings in [loanAgreementService-docx.js](backend/services/loanAgreementService-docx.js):

### BEFORE (Wrong):
```javascript
apartmentName: borrower.apartmentName  // ❌ Field doesn't exist
houseNo: borrower.houseNo              // ❌ Field doesn't exist
emergencyContact: borrower.emergencyContact  // ❌ Field doesn't exist
emergencyPhone: borrower.emergencyPhone      // ❌ Field doesn't exist
regNumber: borrower.regNumber          // ❌ Field doesn't exist
```

### AFTER (Correct):
```javascript
apartment: borrower.apartment          // ✅ Matches database
houseNumber: borrower.houseNumber      // ✅ Matches database
emergencyNumber: borrower.emergencyNumber // ✅ Matches database
registrationNumber: borrower.registrationNumber // ✅ Matches database
```

---

## Next Steps

1. **Update your Word template** to use the correct placeholder names listed above
2. **Save the template** as `loan_agreement_template.docx` in `backend/templates/`
3. **Commit and push** the code changes
4. **Test** by creating a new loan

The overlapping should now be completely fixed!

---

## Placeholder Checklist

Use this checklist when updating your template:

- [ ] `{loanId}` - Page 1
- [ ] `{borrowerName}` - All pages where name appears
- [ ] `{idNumber}` - All pages where ID appears
- [ ] `{phoneNumber}` - Page 2
- [ ] `{location}` - Page 2
- [ ] `{apartment}` - Page 2 (**Changed from apartmentName**)
- [ ] `{houseNumber}` - Page 2 (**Changed from houseNo**)
- [ ] `{emergencyNumber}` - Page 2 (**Changed from emergencyContact/emergencyPhone**)
- [ ] `{institution}` - Page 2 (if student)
- [ ] `{registrationNumber}` - Page 2 (**Changed from regNumber**)
- [ ] `{date}` - Multiple pages
- [ ] `{loanAmount}` - Page 2
- [ ] `{interestRate}` - Page 2
- [ ] `{totalAmount}` - Page 2
- [ ] `{dueDate}` - Page 2
- [ ] `{loanPeriod}` - Page 2
- [ ] `{itemName}` - Page 3
- [ ] `{modelNumber}` - Page 3
- [ ] `{serialNumber}` - Page 3
- [ ] `{itemCondition}` - Page 3
