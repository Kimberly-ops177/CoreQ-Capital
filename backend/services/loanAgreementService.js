const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { sendEmail } = require('./notificationService');

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

    // Loan ID (top left, large)
    page1.drawText(loan.loanId || loan.id.toString(), {
      x: 50,
      y: page1Height - 90,
      size: 32,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    // Borrower name and ID (centered, around y=330 from top)
    const borrowerText = `NAME:  ${borrower.fullName.toUpperCase()}        OF ID:  ${borrower.idNumber}`;
    const borrowerTextWidth = font.widthOfTextAtSize(borrowerText, 11);
    page1.drawText(borrowerText, {
      x: (page1Width - borrowerTextWidth) / 2,
      y: page1Height - 355,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    // Date (centered, around y=305 from top)
    const dateText = formatDateShort(issueDate);
    const dateTextWidth = boldFont.widthOfTextAtSize(dateText, 12);
    page1.drawText(dateText, {
      x: (page1Width - dateTextWidth) / 2,
      y: page1Height - 515,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    // PAGE 2: Fill in agreement details
    const page2 = pages[1];
    const { height: page2Height } = page2.getSize();

    // Date at top of page 2
    page2.drawText(formatDateShort(issueDate), {
      x: 240,
      y: page2Height - 70,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Borrower name in party section (around line 157 in template)
    page2.drawText(borrower.fullName.toUpperCase(), {
      x: 90,
      y: page2Height - 190,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // ID number
    page2.drawText(borrower.idNumber, {
      x: 280,
      y: page2Height - 190,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Phone number
    page2.drawText(borrower.phoneNumber, {
      x: 410,
      y: page2Height - 190,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // ID number in WHEREAS section B (around line 167)
    page2.drawText(borrower.idNumber, {
      x: 380,
      y: page2Height - 280,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Loan amount issued (around line 189)
    page2.drawText(`Ksh ${amountIssued.toLocaleString()}`, {
      x: 330,
      y: page2Height - 535,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Due date
    page2.drawText(formatDateShort(dueDate), {
      x: 400,
      y: page2Height - 550,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Total amount to be repaid
    page2.drawText(`Ksh ${totalAmount.toLocaleString()}`, {
      x: 120,
      y: page2Height - 565,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Loan period
    page2.drawText(`${loan.loanPeriod} week(s)`, {
      x: 200,
      y: page2Height - 620,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // PAGE 3: Fill in collateral details
    const page3 = pages[2];
    const { height: page3Height } = page3.getSize();

    // Collateral item name (around line 226)
    page3.drawText(collateral.itemName, {
      x: 200,
      y: page3Height - 115,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Model number
    page3.drawText(collateral.modelNumber || 'N/A', {
      x: 200,
      y: page3Height - 130,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Serial number
    page3.drawText(collateral.serialNumber || 'N/A', {
      x: 200,
      y: page3Height - 145,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Condition
    page3.drawText(collateral.itemCondition, {
      x: 200,
      y: page3Height - 160,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // PAGE 4: Fill in signature date
    const page4 = pages[3];
    const { height: page4Height } = page4.getSize();

    // Date in certification section (around line 310)
    page4.drawText(formatDateShort(issueDate), {
      x: 340,
      y: page4Height - 485,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Borrower name in certification
    page4.drawText(borrower.fullName.toUpperCase(), {
      x: 290,
      y: page4Height - 500,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // PAGE 5: Fill in statutory declaration
    const page5 = pages[4];
    const { height: page5Height } = page5.getSize();

    // Borrower name in declaration (around line 363)
    page5.drawText(borrower.fullName.toUpperCase(), {
      x: 70,
      y: page5Height - 175,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // ID number in declaration
    page5.drawText(borrower.idNumber, {
      x: 320,
      y: page5Height - 175,
      size: 11,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Date in declaration (around line 387)
    page5.drawText(formatDateShort(issueDate), {
      x: 200,
      y: page5Height - 580,
      size: 11,
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
