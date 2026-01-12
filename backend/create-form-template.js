/**
 * This script converts your existing static PDF template into a form-fillable template
 * by adding PDF form fields at the exact positions where data should be filled.
 *
 * Run this ONCE to create the new template with form fields:
 * node backend/create-form-template.js
 */

const { PDFDocument, PDFTextField, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createFormTemplate() {
  try {
    console.log('Loading existing PDF template...');

    // Load the existing static template
    const templatePath = path.join(__dirname, 'templates/loan_agreement_template.pdf');
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Get the form
    const form = pdfDoc.getForm();

    // Embed fonts for proper text rendering
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pages = pdfDoc.getPages();

    console.log('Adding form fields to Page 1...');
    // PAGE 1 FORM FIELDS
    const page1 = pages[0];
    const { width: p1Width, height: p1Height } = page1.getSize();

    // Loan ID (large, top left)
    const loanIdField = form.createTextField('loan_id');
    loanIdField.addToPage(page1, {
      x: 50,
      y: p1Height - 128,
      width: 200,
      height: 30,
    });
    loanIdField.setFontSize(28);
    loanIdField.enableReadOnly();
    loanIdField.setAlignment(0); // Left align

    // Borrower name on cover page
    const borrowerNameP1 = form.createTextField('borrower_name_p1');
    borrowerNameP1.addToPage(page1, {
      x: 95,
      y: 266,
      width: 220,
      height: 12,
    });
    borrowerNameP1.setFontSize(9);
    borrowerNameP1.enableReadOnly();

    // ID Number on cover page
    const idNumberP1 = form.createTextField('id_number_p1');
    idNumberP1.addToPage(page1, {
      x: 330,
      y: 266,
      width: 150,
      height: 12,
    });
    idNumberP1.setFontSize(9);
    idNumberP1.enableReadOnly();

    // Date on cover page (centered)
    const dateP1 = form.createTextField('date_p1');
    dateP1.addToPage(page1, {
      x: (p1Width - 100) / 2, // Centered
      y: 228,
      width: 100,
      height: 12,
    });
    dateP1.setFontSize(9);
    dateP1.enableReadOnly();
    dateP1.setAlignment(1); // Center align

    console.log('Adding form fields to Page 2...');
    // PAGE 2 FORM FIELDS
    const page2 = pages[1];

    // Date at top right
    const dateTopP2 = form.createTextField('date_top_p2');
    dateTopP2.addToPage(page2, {
      x: 440,
      y: 738,
      width: 100,
      height: 12,
    });
    dateTopP2.setFontSize(9);
    dateTopP2.enableReadOnly();

    // Borrower name in parties section
    const borrowerNameP2 = form.createTextField('borrower_name_p2');
    borrowerNameP2.addToPage(page2, {
      x: 70,
      y: 668,
      width: 230,
      height: 10,
    });
    borrowerNameP2.setFontSize(8);
    borrowerNameP2.enableReadOnly();

    // ID number after "of ID number:"
    const idNumberP2 = form.createTextField('id_number_p2');
    idNumberP2.addToPage(page2, {
      x: 315,
      y: 668,
      width: 140,
      height: 10,
    });
    idNumberP2.setFontSize(8);
    idNumberP2.enableReadOnly();

    // Phone number
    const phoneNumber = form.createTextField('phone_number');
    phoneNumber.addToPage(page2, {
      x: 465,
      y: 668,
      width: 100,
      height: 10,
    });
    phoneNumber.setFontSize(8);
    phoneNumber.enableReadOnly();

    // ID number in WHEREAS clause
    const idNumberWhereas = form.createTextField('id_number_whereas');
    idNumberWhereas.addToPage(page2, {
      x: 530,
      y: 578,
      width: 60,
      height: 10,
    });
    idNumberWhereas.setFontSize(8);
    idNumberWhereas.enableReadOnly();

    // Loan amount issued
    const loanAmount = form.createTextField('loan_amount');
    loanAmount.addToPage(page2, {
      x: 95,
      y: 348,
      width: 100,
      height: 10,
    });
    loanAmount.setFontSize(8);
    loanAmount.enableReadOnly();

    // Due date
    const dueDate = form.createTextField('due_date');
    dueDate.addToPage(page2, {
      x: 260,
      y: 348,
      width: 100,
      height: 10,
    });
    dueDate.setFontSize(8);
    dueDate.enableReadOnly();

    // Total amount to be repaid
    const totalAmount = form.createTextField('total_amount');
    totalAmount.addToPage(page2, {
      x: 120,
      y: 332,
      width: 100,
      height: 10,
    });
    totalAmount.setFontSize(8);
    totalAmount.enableReadOnly();

    // Loan period
    const loanPeriod = form.createTextField('loan_period');
    loanPeriod.addToPage(page2, {
      x: 215,
      y: 268,
      width: 100,
      height: 10,
    });
    loanPeriod.setFontSize(8);
    loanPeriod.enableReadOnly();

    console.log('Adding form fields to Page 3...');
    // PAGE 3 FORM FIELDS (Collateral)
    const page3 = pages[2];

    const itemName = form.createTextField('item_name');
    itemName.addToPage(page3, {
      x: 195,
      y: 690,
      width: 300,
      height: 12,
    });
    itemName.setFontSize(9);
    itemName.enableReadOnly();

    const modelNumber = form.createTextField('model_number');
    modelNumber.addToPage(page3, {
      x: 195,
      y: 674,
      width: 300,
      height: 12,
    });
    modelNumber.setFontSize(9);
    modelNumber.enableReadOnly();

    const serialNumber = form.createTextField('serial_number');
    serialNumber.addToPage(page3, {
      x: 195,
      y: 658,
      width: 300,
      height: 12,
    });
    serialNumber.setFontSize(9);
    serialNumber.enableReadOnly();

    const condition = form.createTextField('condition');
    condition.addToPage(page3, {
      x: 145,
      y: 642,
      width: 350,
      height: 12,
    });
    condition.setFontSize(9);
    condition.enableReadOnly();

    console.log('Adding form fields to Page 4...');
    // PAGE 4 FORM FIELDS (Certification)
    const page4 = pages[3];

    const dateP4 = form.createTextField('date_p4');
    dateP4.addToPage(page4, {
      x: 305,
      y: 410,
      width: 100,
      height: 12,
    });
    dateP4.setFontSize(9);
    dateP4.enableReadOnly();

    const borrowerNameP4 = form.createTextField('borrower_name_p4');
    borrowerNameP4.addToPage(page4, {
      x: 245,
      y: 395,
      width: 250,
      height: 12,
    });
    borrowerNameP4.setFontSize(9);
    borrowerNameP4.enableReadOnly();

    console.log('Adding form fields to Page 5...');
    // PAGE 5 FORM FIELDS (Declaration)
    const page5 = pages[4];

    const borrowerNameP5 = form.createTextField('borrower_name_p5');
    borrowerNameP5.addToPage(page5, {
      x: 22,
      y: 667,
      width: 250,
      height: 10,
    });
    borrowerNameP5.setFontSize(8);
    borrowerNameP5.enableReadOnly();

    const idNumberP5 = form.createTextField('id_number_p5');
    idNumberP5.addToPage(page5, {
      x: 285,
      y: 667,
      width: 150,
      height: 10,
    });
    idNumberP5.setFontSize(8);
    idNumberP5.enableReadOnly();

    const dateP5 = form.createTextField('date_p5');
    dateP5.addToPage(page5, {
      x: 165,
      y: 322,
      width: 100,
      height: 10,
    });
    dateP5.setFontSize(8);
    dateP5.enableReadOnly();

    // Save the new form-fillable template
    const outputPath = path.join(__dirname, 'templates/loan_agreement_form_template.pdf');
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    console.log('\n✅ SUCCESS! Form template created at:');
    console.log(outputPath);
    console.log('\nForm fields added:');

    const allFields = form.getFields();
    allFields.forEach((field, index) => {
      console.log(`  ${index + 1}. ${field.getName()}`);
    });

    console.log(`\nTotal form fields: ${allFields.length}`);
    console.log('\nNext steps:');
    console.log('1. Review the PDF to ensure fields are positioned correctly');
    console.log('2. If positions need adjustment, edit the coordinates in this script and re-run');
    console.log('3. Once satisfied, the service will be updated to use form field filling');

  } catch (error) {
    console.error('Error creating form template:', error);
    throw error;
  }
}

// Run the script
createFormTemplate();
