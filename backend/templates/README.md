# Loan Agreement Template Setup

## Required File

Place your loan agreement PDF template in this directory with the following name:

**`loan_agreement_template.pdf`**

## Steps to Add the Template

1. Locate the "Loan Agreement template.pdf" file you attached
2. Copy it to this folder: `backend/templates/`
3. Rename it to: `loan_agreement_template.pdf` (lowercase, with underscores)

## What the Template Should Contain

The template should be a 5-page PDF with:
- Page 1: Cover page with spaces for loan ID, borrower name, ID, date, and photo
- Page 2: Agreement details with spaces for borrower info, loan amount, due date
- Page 3: Collateral details section
- Page 4: Signatures section with existing director signatures and advocate stamps
- Page 5: Statutory declaration

## How It Works

The system will:
- Load your template PDF
- Overlay borrower-specific information on the appropriate locations
- **Preserve all existing signatures, stamps, and formatting**
- Generate a complete agreement without blank pages

## Fields That Get Auto-Filled

- Loan ID
- Borrower full name
- Borrower ID number
- Borrower phone number
- Date issued
- Loan amount
- Due date
- Total amount to be repaid
- Loan period (weeks)
- Collateral item name
- Collateral model number
- Collateral serial number
- Collateral condition

All other content (signatures, stamps, legal text) remains exactly as in the template.
