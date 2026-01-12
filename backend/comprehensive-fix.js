const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'templates/loan_agreement_template.docx');
const backupPath = path.join(__dirname, `templates/loan_agreement_template.backup-comprehensive-${Date.now()}.docx`);

// Backup
fs.copyFileSync(templatePath, backupPath);
console.log(`Backup: ${backupPath}\n`);

// Load
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
let xml = zip.file('word/document.xml').asText();

console.log('=== COMPREHENSIVE PLACEHOLDER FIX ===\n');

// Remove all proof errors (spell/grammar check markers)
xml = xml.replace(/<w:proofErr[^>]*\/>/g, '');
console.log('✓ Removed spell/grammar check markers');

// Consolidate adjacent text runs
// This regex finds patterns like </w:t></w:r><w:r><w:t> and merges them
xml = xml.replace(/<\/w:t><\/w:r><w:r[^>]*><w:rPr>.*?<\/w:rPr><w:t>/g, '');
xml = xml.replace(/<\/w:t><\/w:r><w:r><w:t>/g, '');
console.log('✓ Consolidated adjacent text runs');

// Find all potential placeholder fragments
const fragmentPattern = /\{[^}]*\}/g;
const matches = xml.match(fragmentPattern);

if (matches) {
  console.log(`\n Found ${matches.length} potential placeholders`);
  const unique = [...new Set(matches)];
  console.log('Placeholders found:', unique.join(', '));
}

// Fix pattern: {text split across runs}
// Match: {</w:t>...</w:r>...<w:t>text</w:t>...</w:r>...<w:t>}
const fullPattern = /\{<\/w:t>.*?<w:t[^>]*>([a-zA-Z]+)<\/w:t>.*?<w:t[^>]*>\}/gs;

xml = xml.replace(fullPattern, (match, placeholderName) => {
  console.log(`✓ Fixed fragmented: {${placeholderName}}`);
  return `{${placeholderName}}`;
});

// Clean up empty runs
xml = xml.replace(/<w:r[^>]*><w:rPr>.*?<\/w:rPr><w:t><\/w:t><\/w:r>/g, '');
xml = xml.replace(/<w:r><w:t><\/w:t><\/w:r>/g, '');

// Save
zip.file('word/document.xml', xml);
const fixed = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, fixed);

console.log(`\n✓ Template fixed and saved!`);
