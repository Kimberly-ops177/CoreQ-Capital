const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function checkPDFFields() {
  try {
    const pdfPath = path.join(__dirname, 'templates/loan_agreement_template.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log(`\nPDF has ${fields.length} form fields:\n`);

    if (fields.length === 0) {
      console.log('❌ No form fields found in PDF!');
      console.log('This PDF has text placeholders but no form fields.');
      console.log('\nTo use form field approach, you need to:');
      console.log('1. Open the PDF in Adobe Acrobat Pro');
      console.log('2. Go to Tools > Prepare Form');
      console.log('3. Add text fields where placeholders are');
      console.log('4. Name each field appropriately');
    } else {
      console.log('✅ Form fields found:');
      fields.forEach(field => {
        const name = field.getName();
        console.log(`   - ${name}`);
      });
    }
  } catch (error) {
    console.error('Error checking PDF:', error);
  }
}

checkPDFFields();
