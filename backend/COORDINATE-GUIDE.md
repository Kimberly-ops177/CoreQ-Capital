# PDF Coordinate Adjustment Guide

## Quick Reference

### Page Dimensions
- **Width**: 612 points
- **Height**: 792 points
- **Origin (0,0)**: Bottom-left corner

### How to Adjust Coordinates

#### Moving Text Horizontally (X coordinate)
- **Move RIGHT**: Increase X value by 5-10
- **Move LEFT**: Decrease X value by 5-10

Example:
```json
"borrowerName": { "x": 95, ... }  // Text appears too far left
"borrowerName": { "x": 105, ... } // Move right by 10
```

#### Moving Text Vertically (Y coordinate)
- **Move UP**: Increase y_from_bottom value by 5-10
- **Move DOWN**: Decrease y_from_bottom value by 5-10

Example:
```json
"borrowerName": { ..., "y_from_bottom": 266 }  // Text too high
"borrowerName": { ..., "y_from_bottom": 256 }  // Move down by 10
```

#### Adjusting Text Size
```json
"size": 9   // Current size
"size": 10  // Make larger
"size": 8   // Make smaller
```

## Step-by-Step Adjustment Process

1. **Generate Test PDF**: Create a test loan
2. **Identify Issue**: Note which field is misaligned
3. **Determine Direction**: Is it too high/low/left/right?
4. **Calculate Adjustment**: Estimate pixels to move (usually 5-20)
5. **Edit JSON**: Update the corresponding value in `pdf-coordinates.json`
6. **Commit & Deploy**: Push to Railway
7. **Test Again**: Generate new test loan
8. **Repeat**: Fine-tune until perfect

## Common Adjustments

### Text Overlapping with Label
**Problem**: "JOHN DOE" overlaps with "NAME:"
**Solution**: Increase X coordinate to move text right
```json
"borrowerName": { "x": 95, ... }  // Before
"borrowerName": { "x": 110, ... } // After - moved 15 pixels right
```

### Text Too Far from Expected Position
**Problem**: Text appears way below where it should be
**Solution**: Increase y_from_bottom significantly
```json
"borrowerName": { ..., "y_from_bottom": 266 }  // Before
"borrowerName": { ..., "y_from_bottom": 520 }  // After - moved up
```

### Text Too Small/Large
**Problem**: Text doesn't fit in the space
**Solution**: Adjust font size
```json
"size": 10  // Before
"size": 8   // After - smaller to fit
```

## Field Reference by Page

### Page 1 (Cover Page)
- **loanId**: Top-left, large loan number
- **borrowerName**: After "NAME:" label
- **idNumber**: After "OF ID:" label (same line as name)
- **date**: Centered, below "DATED" label

### Page 2 (Agreement Details)
- **dateTop**: Date at top of page
- **borrowerName**: In "PARTIES" section
- **idNumber**: Same line as name
- **phoneNumber**: Same line as name and ID
- **idNumberWhereas**: In "WHEREAS" clause B
- **loanAmount**: Loan amount issued (Ksh...)
- **dueDate**: Payment due date
- **totalAmount**: Total amount to repay
- **loanPeriod**: Loan duration in weeks

### Page 3 (Collateral)
- **itemName**: Name of collateral item
- **modelNumber**: Model/make of item
- **serialNumber**: Serial/IMEI number
- **condition**: Item condition

### Page 4 (Signatures)
- **date**: Date in certification
- **borrowerName**: Borrower name in certification

### Page 5 (Declaration)
- **borrowerName**: After "I..."
- **idNumber**: After "Of ID Number"
- **date**: After "This day of"

## Tips

1. **Start Small**: Adjust by 5-10 pixels at a time
2. **One Field at a Time**: Fix one field, test, then move to next
3. **Use Reference Points**: Compare to template blank lines
4. **Font Size Matters**: Sometimes reducing size is better than moving position
5. **Bold vs Regular**: Bold text takes slightly more space

## Need Help?

Share a screenshot showing:
1. Which page has the issue
2. Which field is misaligned
3. Where it currently appears vs where it should be

I'll calculate the exact coordinates for you!
