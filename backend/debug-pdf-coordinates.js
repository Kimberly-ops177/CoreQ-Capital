/**
 * Debug script to analyze PDF template and find exact coordinates
 * This will help determine where text should be placed
 */

const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function analyzePDFTemplate() {
  try {
    const templatePath = path.join(__dirname, 'templates/loan_agreement_template.pdf');

    if (!fs.existsSync(templatePath)) {
      console.error('Template not found at:', templatePath);
      return;
    }

    // Load the template
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();

    console.log('\n=== PDF TEMPLATE ANALYSIS ===\n');
    console.log(`Total pages: ${pages.length}\n`);

    // Analyze each page
    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      console.log(`Page ${index + 1}:`);
      console.log(`  Width: ${width}`);
      console.log(`  Height: ${height}`);
      console.log(`  Coordinate system: (0,0) is bottom-left, (${width},${height}) is top-right`);

      // Add a grid of reference points on the page
      // This will help visualize where coordinates are
      for (let y = 50; y < height; y += 50) {
        for (let x = 50; x < width; x += 100) {
          page.drawText(`(${x},${Math.round(height - y)})`, {
            x: x,
            y: y,
            size: 6,
            font: font,
            color: rgb(0.8, 0.8, 0.8) // Light gray
          });
        }
      }

      console.log('');
    });

    // Save the annotated PDF
    const debugBytes = await pdfDoc.save();
    const debugPath = path.join(__dirname, 'uploads/agreements/debug_template_with_coordinates.pdf');

    // Ensure directory exists
    const uploadsDir = path.dirname(debugPath);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    fs.writeFileSync(debugPath, debugBytes);

    console.log('=== COORDINATE GRID CREATED ===');
    console.log(`Debug PDF saved to: ${debugPath}`);
    console.log('\nThis PDF has coordinate markers every 50 pixels vertically and 100 pixels horizontally.');
    console.log('Use this to identify the exact coordinates where text should be placed.\n');
    console.log('Format: (x, y-from-top)');
    console.log('Note: In pdf-lib, y is measured from BOTTOM, so use: y: pageHeight - y-from-top\n');

  } catch (error) {
    console.error('Error analyzing PDF:', error);
  }
}

// Run the analysis
analyzePDFTemplate();
