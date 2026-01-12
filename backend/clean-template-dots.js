const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatePath = path.join(__dirname, 'templates/loan_agreement_template.docx');
const backupPath = path.join(
  __dirname,
  'templates',
  `loan_agreement_template.backup-${Date.now()}.docx`
);

if (!fs.existsSync(templatePath)) {
  console.error('Template not found at', templatePath);
  process.exit(1);
}

// Backup first
fs.copyFileSync(templatePath, backupPath);
console.log('Backup created at', backupPath);

const data = fs.readFileSync(templatePath);
const zip = new PizZip(data);

const docPath = 'word/document.xml';
const docXml = zip.file(docPath).asText();

let cleaned = docXml;

// Remove dotted/underscore leaders immediately before/after placeholders
const patterns = [
  /\.{2,}(?=\{)/g,      // dots before placeholder
  /(?<=\})\.{2,}/g,      // dots after placeholder
  /…+(?=\{)/g,           // ellipsis before
  /(?<=\})…+/g,          // ellipsis after
  /_{2,}(?=\{)/g,        // underscores before
  /(?<=\})_{2,}/g        // underscores after
];

patterns.forEach((regex) => {
  cleaned = cleaned.replace(regex, '');
});

// Remove long runs of dots/ellipses/underscores anywhere (common for dotted lines)
cleaned = cleaned
  .replace(/\.{4,}/g, '')
  .replace(/…{2,}/g, '')
  .replace(/_{4,}/g, '');

zip.file(docPath, cleaned);
const output = zip.generate({ type: 'nodebuffer' });
fs.writeFileSync(templatePath, output);

console.log('Cleaned dotted leaders and saved template.');
