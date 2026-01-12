# PDF Form Field Migration Guide

## Overview

This guide will help you migrate from the **coordinate-based overlay method** (which causes overlapping) to the **form field filling method** (clean, professional, no overlapping).

---

## Why This Method is Better

### Current Method (Coordinate Overlay)
❌ Text overlaps with template labels
❌ Hard to maintain - coordinates need constant adjustment
❌ Long text overflows and looks unprofessional
❌ Every template change requires code updates

### New Method (Form Fields)
✅ **No overlapping** - fields are properly positioned
✅ **Text auto-fits** in designated areas
✅ **Professional appearance** - looks like a real legal document
✅ **Easy to adjust** - change field positions in template, not code
✅ **Industry standard** - used by all professional loan systems

---

## Migration Steps

### Step 1: Create Form Template (One-Time Setup)

Run the script to add form fields to your existing PDF template:

```bash
cd backend
node create-form-template.js
```

**What this does:**
- Loads your existing `loan_agreement_template.pdf`
- Adds 27 form fields at the correct positions
- Saves as `loan_agreement_form_template.pdf`
- Original template remains unchanged (backup)

**Output:**
```
✅ SUCCESS! Form template created at:
backend/templates/loan_agreement_form_template.pdf

Form fields added:
  1. loan_id
  2. borrower_name_p1
  3. id_number_p1
  ... (27 total fields)
```

---

### Step 2: Test the Form Template

Open the generated PDF in Adobe Acrobat or a browser and verify:

1. **Check field positions**: Click on the PDF - you should see blue/highlighted boxes where fields are
2. **Test filling**: Try typing in the fields to ensure they're in the right spots
3. **Verify all pages**: Go through all 5 pages to ensure fields are positioned correctly

**If fields need adjustment:**
- Edit the coordinates in `create-form-template.js`
- Re-run: `node create-form-template.js`
- Test again until perfect

---

### Step 3: Switch to New Service

Once you're satisfied with field positions:

```bash
# Backup the old service (just in case)
cp services/loanAgreementService.js services/loanAgreementService-old.js

# Replace with the new form-filling service
cp services/loanAgreementService-formfill.js services/loanAgreementService.js
```

**Or manually:**
1. Rename `loanAgreementService.js` to `loanAgreementService-old.js`
2. Rename `loanAgreementService-formfill.js` to `loanAgreementService.js`

---

### Step 4: Test with Real Data

Generate a test loan agreement:

```bash
# From your backend, use your existing loan creation endpoint
# Example: Create a new loan through your API and check the generated PDF
```

**What to verify:**
- All borrower information appears correctly
- No overlapping with template text
- Text fits properly in all fields
- Professional appearance
- All 5 pages are filled correctly

---

### Step 5: Deploy

Once everything works locally:

```bash
git add .
git commit -m "Switch to form field filling for PDF generation - fixes overlapping issues"
git push origin main
```

Railway will auto-deploy with the new service.

---

## Field Reference

### Page 1 (Cover)
- `loan_id` - Loan ID number (top left, large)
- `borrower_name_p1` - Borrower full name
- `id_number_p1` - ID/passport number
- `date_p1` - Agreement date (centered)

### Page 2 (Agreement Details)
- `date_top_p2` - Date at top right
- `borrower_name_p2` - Borrower name in parties section
- `id_number_p2` - ID after "of ID number:"
- `phone_number` - Borrower phone
- `id_number_whereas` - ID in WHEREAS clause
- `loan_amount` - Amount issued
- `due_date` - Repayment due date
- `total_amount` - Total amount to repay
- `loan_period` - Loan period in weeks

### Page 3 (Collateral)
- `item_name` - Collateral item name
- `model_number` - Model/make
- `serial_number` - Serial/IMEI
- `condition` - Item condition

### Page 4 (Certification)
- `date_p4` - Certification date
- `borrower_name_p4` - Borrower name

### Page 5 (Declaration)
- `borrower_name_p5` - Borrower name
- `id_number_p5` - ID number
- `date_p5` - Declaration date

---

## Adjusting Field Positions

If a field needs to be moved:

1. **Open** `create-form-template.js`
2. **Find** the field creation code, example:
   ```javascript
   const borrowerNameP1 = form.createTextField('borrower_name_p1');
   borrowerNameP1.addToPage(page1, {
     x: 95,        // ← Move left/right
     y: 266,       // ← Move up/down
     width: 220,   // ← Field width
     height: 12,   // ← Field height
   });
   ```
3. **Adjust** coordinates:
   - Increase `x` to move RIGHT
   - Increase `y` to move UP
   - Adjust `width` to make field wider/narrower
   - Adjust `height` to make field taller/shorter
4. **Re-run** `node create-form-template.js`
5. **Test** the new template

---

## Rollback Plan

If something goes wrong, you can instantly rollback:

```bash
# Restore old service
cp services/loanAgreementService-old.js services/loanAgreementService.js

# Commit and push
git add services/loanAgreementService.js
git commit -m "Rollback to coordinate-based PDF generation"
git push origin main
```

Your old template (`loan_agreement_template.pdf`) is still there and unchanged.

---

## Technical Details

### How Form Filling Works

1. **Template has form fields** (like a fillable PDF you'd download)
2. **Service fills the fields** programmatically with borrower data
3. **PDF is flattened** - fields become regular text (non-editable)
4. **Result looks like a normal document** - no field highlighting

### Code Comparison

**Old Method (Coordinate Overlay):**
```javascript
page1.drawText(borrower.fullName.toUpperCase(), {
  x: 95,  // Hard to maintain
  y: 266, // Easy to misalign
  size: 9,
  font: boldFont
});
```

**New Method (Form Fields):**
```javascript
form.getTextField('borrower_name_p1').setText(borrower.fullName.toUpperCase());
// Clean, simple, reliable
```

---

## FAQ

**Q: Will old PDFs still work?**
A: Yes! This only affects newly generated PDFs. Existing PDFs are unchanged.

**Q: Can I still edit the template?**
A: Yes! Edit the template, then re-run `create-form-template.js` to regenerate the form template.

**Q: What if a field is too small for long text?**
A: Adjust the `width` parameter for that field and regenerate.

**Q: Do I need to delete old files?**
A: No, keep them as backups. Only the active `loanAgreementService.js` is used.

**Q: How long does migration take?**
A: ~15 minutes total:
- 2 min: Run form template script
- 5 min: Test and adjust if needed
- 3 min: Switch services
- 5 min: Deploy and verify

---

## Support

If you encounter issues:

1. Check that `loan_agreement_form_template.pdf` exists
2. Verify all 27 form fields were created (check console output)
3. Test locally before deploying
4. Keep `loanAgreementService-old.js` as backup

---

## Next Steps

After successful migration:

1. ✅ Generate several test PDFs
2. ✅ Verify with different borrower data (long names, different formats)
3. ✅ Deploy to production
4. ✅ Delete old coordinate config files (optional cleanup):
   - `config/pdf-coordinates.json`
   - `COORDINATE-GUIDE.md`
   - `debug-pdf-coordinates.js`
