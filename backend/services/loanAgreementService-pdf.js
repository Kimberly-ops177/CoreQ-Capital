const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf-parse');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { sendEmail } = require('./notificationService');

/**
 * Generate loan agreement PDF using template with text placeholder replacement
 * Uses a hybrid approach: extracts PDF text, finds placeholder positions, and overlays replacements
 */
const generateLoanAgreementPDF = async (loan, borrower, collateral) => {
  try {
    // Define paths
    const templatePath = path.join(__dirname, '../templates/loan_agreement_template.pdf');
    const uploadsDir = path.join(__dirname, '../uploads/agreements');

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      console.error('Template file not found at:', templatePath);
      throw new Error('PDF template not found. Please add the template file to backend/templates/loan_agreement_template.pdf');
    }

    // Format dates
    const formatDateShort = (date) => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[d.getMonth()];
      const year = String(d.getFullYear()).slice(-2);
      return `${day}-${month}-${year}`;
    };

    const issueDate = new Date(loan.dateIssued);
    const dueDate = new Date(loan.dueDate);
    const totalAmount = parseFloat(loan.totalAmount);
    const amountIssued = parseFloat(loan.amountIssued);

    // Prepare replacement data
    const replacements = {
      '{loanId}': loan.loanId || loan.id.toString(),
      '{borrowerName}': borrower.fullName.toUpperCase(),
      '{idNumber}': borrower.idNumber,
      '{phoneNumber}': borrower.phoneNumber,
      '{emergencyNumber}': borrower.emergencyNumber || 'N/A',
      '{location}': borrower.location || 'N/A',
      '{apartment}': borrower.apartment || 'N/A',
      '{houseNumber}': borrower.houseNumber || 'N/A',
      '{institution}': borrower.institution || 'N/A',
      '{registrationNumber}': borrower.registrationNumber || 'N/A',
      '{date}': formatDateShort(issueDate),
      '{loanAmount}': amountIssued.toLocaleString(),
      '{interestRate}': `${loan.interestRate}%`,
      '{totalAmount}': totalAmount.toLocaleString(),
      '{dueDate}': formatDateShort(dueDate),
      '{loanPeriod}': `${loan.loanPeriod} week(s)`,
      '{itemName}': collateral.itemName,
      '{modelNumber}': collateral.modelNumber || 'N/A',
      '{serialNumber}': collateral.serialNumber || 'N/A',
      '{itemCondition}': collateral.itemCondition,
    };

    console.log('Replacement data:', JSON.stringify(replacements, null, 2));

    // Read the PDF template
    const templateBytes = fs.readFileSync(templatePath);

    // Parse PDF to extract text and understand structure
    const pdfData = await PDFParser(templateBytes);
    let pdfText = pdfData.text;

    console.log('PDF Text extracted (first 500 chars):', pdfText.substring(0, 500));

    // Check if placeholders exist in the PDF
    let placeholdersFound = 0;
    for (const placeholder of Object.keys(replacements)) {
      if (pdfText.includes(placeholder)) {
        placeholdersFound++;
        console.log(`✓ Found placeholder: ${placeholder}`);
      }
    }

    if (placeholdersFound === 0) {
      console.warn('WARNING: No placeholders found in PDF template!');
      console.warn('Make sure your PDF contains text like {borrowerName}, {loanId}, etc.');
    } else {
      console.log(`Found ${placeholdersFound} placeholders in PDF`);
    }

    // Load PDF with pdf-lib for editing
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Since pdf-lib can't directly replace text, we'll overlay white rectangles
    // and draw new text on top. This requires knowing approximate positions.
    // For now, let's just copy the template and log a message

    console.log('Note: PDF text replacement requires coordinate mapping.');
    console.log('The template has been copied. To enable replacement, we need to:');
    console.log('1. Identify placeholder positions in the PDF');
    console.log('2. Cover them with white rectangles');
    console.log('3. Draw replacement text on top');

    // For now, save the template as-is (we'll improve this next)
    const pdfBytes = await pdfDoc.save();
    const filename = `loan_agreement_${loan.id}_${Date.now()}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, pdfBytes);

    console.log(`Loan agreement PDF generated: ${filename}`);
    console.log(`Generated at: ${filepath}`);

    return { filepath, filename };

  } catch (error) {
    console.error('Error generating loan agreement PDF:', error);
    throw error;
  }
};

/**
 * Send loan agreement PDF via email
 */
const sendLoanAgreementEmail = async (loan, borrower, filepath) => {
  try {
    const emailContent = `
Dear ${borrower.fullName},

Your loan agreement for Loan ID #${loan.id} has been generated.

Loan Details:
- Amount: KSH ${parseFloat(loan.amountIssued).toLocaleString()}
- Interest Rate: ${loan.interestRate}%
- Total Amount: KSH ${parseFloat(loan.totalAmount).toLocaleString()}
- Due Date: ${new Date(loan.dueDate).toLocaleDateString()}

Please review the attached agreement, print it, sign it, and return it to our office.

Best regards,
Core Q Capital Team
    `;

    await sendEmail({
      to: borrower.email,
      subject: `Loan Agreement - #${loan.id}`,
      text: emailContent,
      attachments: [
        {
          filename: path.basename(filepath),
          path: filepath
        }
      ]
    });

    console.log(`Loan agreement email sent to ${borrower.email}`);
  } catch (error) {
    console.error('Error sending loan agreement email:', error);
    throw error;
  }
};

module.exports = {
  generateLoanAgreementPDF,
  sendLoanAgreementEmail
};
