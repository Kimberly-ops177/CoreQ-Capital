# How to Fix the Overlapping Issue in Word Template

The overlapping happens because Word is storing your placeholders in a fragmented way internally (split across multiple XML runs), so docxtemplater can't find and replace them properly.

## Solution: Clean and Retype Placeholders

Follow these steps **exactly**:

### Step 1: Open Your Template
Open `backend/templates/loan_agreement_template.docx` in Microsoft Word

### Step 2: Find Each Placeholder
Look for these placeholders in your document:
- `{loanId}`
- `{borrowerName}` (appears multiple times)
- `{idNumber}` (appears multiple times)
- `{phoneNumber}`
- `{emergencyContact}`
- `{emergencyPhone}`
- `{location}`
- `{apartmentName}`
- `{houseNo}`
- `{institution}`
- `{regNumber}`
- `{date}` (appears multiple times)
- `{loanAmount}`
- `{interestRate}`
- `{totalAmount}`
- `{dueDate}`
- `{loanPeriod}`
- `{itemName}`
- `{modelNumber}`
- `{serialNumber}`
- `{itemCondition}`

### Step 3: For EACH Placeholder, Do This:

1. **Select the entire placeholder** (including the curly braces `{}`)
   - Example: Select `{borrowerName}` completely

2. **Delete it completely** (press Delete or Backspace)

3. **Type it again from scratch**
   - Type exactly: `{borrowerName}` (no spaces, no formatting)
   - Make sure you type the ENTIRE thing in one go without stopping
   - Don't copy-paste - TYPE IT FRESH

4. **Important**: Do NOT apply any formatting (bold, italic, underline, color) to the placeholder text itself. Keep it plain.

### Step 4: Why This Works

Word internally stores text in XML "runs". When you copy-paste or format text, Word might split `{borrowerName}` across multiple runs like:
```xml
<w:r><w:t>{borrower</w:t></w:r>
<w:r><w:t>Name}</w:t></w:r>
```

Docxtemplater can't find this split placeholder, so it doesn't replace it.

When you type it fresh in one go, Word stores it as one continuous run:
```xml
<w:r><w:t>{borrowerName}</w:t></w:r>
```

Now docxtemplater can find and replace it properly.

### Step 5: Save the Fixed Template

1. After fixing ALL placeholders on ALL pages
2. **Save As** → `loan_agreement_template.docx`
3. Save in the same location: `backend/templates/`
4. Overwrite the old file

### Step 6: Test

1. Create a new loan through your dashboard
2. Check the generated DOCX file
3. The overlapping should be gone!

---

## Quick Check: Are Placeholders Fragmented?

To check if a placeholder is fragmented:
1. Click in the middle of `{borrowerName}`
2. Press **Ctrl+Shift+Right Arrow** to select to the end
3. If it only selects part of the placeholder (like just `Name}`), it's fragmented
4. If it selects the entire `borrowerName}`, it might be okay

---

## Alternative: Use Plain Text Mode

If retyping doesn't work:
1. Copy all content from Word
2. Paste into Notepad (plain text)
3. Add placeholders in Notepad
4. Copy back to Word
5. Format the document (fonts, colors, etc.)
6. Save as DOCX

This ensures no hidden formatting breaks the placeholders.
