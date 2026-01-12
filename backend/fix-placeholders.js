const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

/**
 * This script fixes fragmented placeholders in Word documents
 * by creating a completely clean template with proper placeholder formatting
 */

const templatePath = path.join(__dirname, 'templates/loan_agreement_template.docx');
const outputPath = path.join(__dirname, 'templates/loan_agreement_template_fixed.docx');
const backupPath = path.join(__dirname, `templates/loan_agreement_template.backup-${Date.now()}.docx`);

// Backup original
fs.copyFileSync(templatePath, backupPath);
console.log(`Backup created at ${backupPath}`);

// Load the template
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

// Get the XML
let documentXml = zip.file('word/document.xml').asText();

console.log('\n=== FIXING FRAGMENTED PLACEHOLDERS ===\n');

// List of all placeholders that should be in the template
const placeholders = [
  'loanId',
  'borrowerName',
  'idNumber',
  'phoneNumber',
  'emergencyNumber',
  'location',
  'apartment',
  'houseNumber',
  'institution',
  'registrationNumber',
  'date',
  'loanAmount',
  'interestRate',
  'totalAmount',
  'dueDate',
  'loanPeriod',
  'itemName',
  'modelNumber',
  'serialNumber',
  'itemCondition'
];

// Function to find and fix fragmented placeholders
function fixFragmentedPlaceholder(xml, placeholder) {
  // Pattern to match fragmented placeholder across multiple runs
  // This matches {placeholder} even when split across <w:r> tags
  const pattern = new RegExp(
    `({[^}]*?)?\\{[^}]*?</w:t></w:r>.*?<w:t[^>]*>${placeholder}</w:t></w:r>.*?<w:t[^>]*>}`,
    'gs'
  );

  let count = 0;
  xml = xml.replace(pattern, (match) => {
    count++;
    // Replace with a single clean run containing the complete placeholder
    return `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="20"/></w:rPr><w:t>{${placeholder}}</w:t></w:r>`;
  });

  if (count > 0) {
    console.log(`✓ Fixed ${count} fragmented occurrence(s) of {${placeholder}}`);
  }

  return xml;
}

// Fix each placeholder
placeholders.forEach(placeholder => {
  documentXml = fixFragmentedPlaceholder(documentXml, placeholder);
});

// Also remove dotted leaders (.... characters) that might interfere
documentXml = documentXml.replace(/<w:t>([.…]+|\.{2,})<\/w:t>/g, '');
console.log('\n✓ Removed dotted leaders\n');

// Save the fixed XML back to the zip
zip.file('word/document.xml', documentXml);

// Generate the fixed document
const fixedContent = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE'
});

// Save the fixed template
fs.writeFileSync(outputPath, fixedContent);
console.log(`✓ Fixed template saved to: ${outputPath}`);
console.log('\nNow replace the old template with the fixed one:');
console.log(`  1. Delete: ${templatePath}`);
console.log(`  2. Rename: ${outputPath} -> loan_agreement_template.docx`);
console.log('\nOr run this command:');
console.log(`  move /Y "${outputPath}" "${templatePath}"`);
