const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { sendEmail } = require('./notificationService');

// Load PDF coordinates from config file
const coordsPath = path.join(__dirname, '../config/pdf-coordinates.json');
const PDF_COORDS = JSON.parse(fs.readFileSync(coordsPath, 'utf8'));

/**
 * Generate loan agreement PDF using the template and filling in borrower details
 * This preserves all existing signatures, stamps, and formatting from the template
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
      console.error('Please place "Loan Agreement template.pdf" in backend/templates/ folder and rename it to "loan_agreement_template.pdf"');
      throw new Error('PDF template not found. Please add the template file to backend/templates/loan_agreement_template.pdf');
    }

    // Load the template PDF
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Get pages
    const pages = pdfDoc.getPages();
    if (pages.length < 5) {
      throw new Error('Template PDF should have at least 5 pages');
    }

    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

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

    // PAGE 1: Fill in cover page details
    const page1 = pages[0];
    const { width: page1Width, height: page1Height } = page1.getSize();
    const p1 = PDF_COORDS.page1;

    // Loan ID (top left, large)
    page1.drawText(loan.loanId || loan.id.toString(), {
      x: p1.loanId.x,
      y: page1Height - p1.loanId.y_from_top,
      size: p1.loanId.size,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    // Borrower name
    page1.drawText(borrower.fullName.toUpperCase(), {
      x: p1.borrowerName.x,
      y: p1.borrowerName.y_from_bottom,
      size: p1.borrowerName.size,
      font: p1.borrowerName.bold ? boldFont : font,
      color: rgb(0, 0, 0)
    });

    // ID number
    page1.drawText(borrower.idNumber, {
      x: p1.idNumber.x,
      y: p1.idNumber.y_from_bottom,
      size: p1.idNumber.size,
      font: p1.idNumber.bold ? boldFont : font,
      color: rgb(0, 0, 0)
    });

    // Date (centered below DATED)
    const dateText = formatDateShort(issueDate);
    const dateFont = p1.date.bold ? boldFont : font;
    const dateTextWidth = dateFont.widthOfTextAtSize(dateText, p1.date.size);
    page1.drawText(dateText, {
      x: p1.date.x_centered ? (page1Width - dateTextWidth) / 2 : p1.date.x,
      y: p1.date.y_from_bottom,
      size: p1.date.size,
      font: dateFont,
      color: rgb(0, 0, 0)
    });

    // PAGE 2: Fill in agreement details
    const page2 = pages[1];
    const { height: page2Height } = page2.getSize();

    // Date at top of page 2
    page2.drawText(formatDateShort(issueDate), {
      x: 440,
      y: 738,
      size: 9,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Borrower name in party section
    page2.drawText(borrower.fullName.toUpperCase(), {
      x: 70,
      y: 668,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // ID number - after "of ID number:"
    page2.drawText(borrower.idNumber, {
      x: 315,
      y: 668,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Phone number - after "Phone Number"
    page2.drawText(borrower.phoneNumber, {
      x: 465,
      y: 668,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // ID number in WHEREAS section B
    page2.drawText(borrower.idNumber, {
      x: 530,
      y: 578,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Loan amount issued
    page2.drawText(amountIssued.toLocaleString(), {
      x: 95,
      y: 348,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Due date
    page2.drawText(formatDateShort(dueDate), {
      x: 260,
      y: 348,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Total amount to be repaid
    page2.drawText(totalAmount.toLocaleString(), {
      x: 120,
      y: 332,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Loan period
    page2.drawText(`${loan.loanPeriod} week(s)`, {
      x: 215,
      y: 268,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // PAGE 3: Fill in collateral details
    const page3 = pages[2];

    // Collateral item name
    page3.drawText(collateral.itemName, {
      x: 195,
      y: 690,
      size: 9,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Model number
    page3.drawText(collateral.modelNumber || 'N/A', {
      x: 195,
      y: 674,
      size: 9,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Serial number
    page3.drawText(collateral.serialNumber || 'N/A', {
      x: 195,
      y: 658,
      size: 9,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Condition
    page3.drawText(collateral.itemCondition, {
      x: 145,
      y: 642,
      size: 9,
      font: font,
      color: rgb(0, 0, 0)
    });

    // PAGE 4: Fill in signature date
    const page4 = pages[3];

    // Date in certification section
    page4.drawText(formatDateShort(issueDate), {
      x: 305,
      y: 410,
      size: 9,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Borrower name in certification
    page4.drawText(borrower.fullName.toUpperCase(), {
      x: 245,
      y: 395,
      size: 9,
      font: font,
      color: rgb(0, 0, 0)
    });

    // PAGE 5: Fill in statutory declaration
    const page5 = pages[4];

    // Borrower name in declaration - after "I…"
    page5.drawText(borrower.fullName.toUpperCase(), {
      x: 22,
      y: 667,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // ID number in declaration - after "Of ID Number…"
    page5.drawText(borrower.idNumber, {
      x: 285,
      y: 667,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Date in declaration - after "This day of……"
    page5.drawText(formatDateShort(issueDate), {
      x: 165,
      y: 322,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Save the filled PDF
    const pdfBytes = await pdfDoc.save();
    const filename = `loan_agreement_${loan.id}_${Date.now()}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, pdfBytes);

    console.log(`Loan agreement PDF generated: ${filename}`);
    console.log(`Loan agreement PDF generated at ${filepath} for loan #${loan.id}`);

    return { filepath, filename };

  } catch (error) {
    console.error('Error generating loan agreement PDF:', error);
    throw error;
  }
};

/**
 * Send loan agreement email with PDF attachment to borrower
 */
const sendLoanAgreementEmail = async (loan, borrower, pdfPath) => {
  if (!borrower.email) {
    console.log(`No email address for borrower ${borrower.fullName}`);
    return { success: false, error: 'No email address' };
  }

  const totalAmount = parseFloat(loan.totalAmount);
  const dueDate = new Date(loan.dueDate).toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const emailSubject = `Your Loan Agreement - Core Q Capital (${loan.loanId || `Loan #${loan.id}`})`;
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4A90A4; padding: 20px; text-align: center; color: white; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .amount { font-size: 24px; color: #4A90A4; font-weight: bold; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
        .important { background-color: #FFF3CD; padding: 15px; border-left: 4px solid #FFC107; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Core Q Capital</h1>
          <p>A Partner You Can Trust</p>
        </div>
        <div class="content">
          <h2>Loan Agreement Generated</h2>
          <p>Dear ${borrower.fullName},</p>

          <p>Your loan has been successfully processed! Please find your loan agreement attached to this email.</p>

          <div class="important">
            <h3>Loan Details:</h3>
            <ul>
              <li><strong>Loan ID:</strong> ${loan.loanId || `#${loan.id}`}</li>
              <li><strong>Loan Amount:</strong> KSH ${parseFloat(loan.amountIssued).toLocaleString()}</li>
              <li><strong>Interest Rate:</strong> ${loan.interestRate}%</li>
              <li><strong>Total Amount Due:</strong> <span class="amount">KSH ${totalAmount.toLocaleString()}</span></li>
              <li><strong>Loan Period:</strong> ${loan.loanPeriod} week(s)</li>
              <li><strong>Due Date:</strong> ${dueDate}</li>
            </ul>
          </div>

          <h3>Payment Details:</h3>
          <p>When making repayments, use these details:</p>
          <ul>
            <li><strong>Pay bill No:</strong> 522533</li>
            <li><strong>Account:</strong> 7862638</li>
          </ul>

          <p>If you have any questions or concerns, please don't hesitate to contact us.</p>

          <p>Thank you for choosing Core Q Capital.</p>

          <p>Best regards,<br>
          <strong>Core Q Capital Team</strong><br>
          ORIRI & ASSOCIATE LAW ADVOCATES<br>
          P.O.BOX 37367-00100, NAIROBI<br>
          Email: katesheila23@gmail.com</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please review the attached agreement.</p>
          <p>© ${new Date().getFullYear()} Core Q Capital Enterprises. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(borrower.email, emailSubject, emailHTML);
    console.log(`Loan agreement email sent to ${borrower.email}`);
    return result;
  } catch (error) {
    console.error(`Error sending loan agreement email:`, error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateLoanAgreementPDF,
  sendLoanAgreementEmail
};
