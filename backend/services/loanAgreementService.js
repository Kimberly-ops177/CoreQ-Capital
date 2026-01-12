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
      y: page1Height - 100,
      size: 28,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    // Borrower name - place on the line after "NAME:"
    page1.drawText(borrower.fullName.toUpperCase(), {
      x: 95,
      y: page1Height - 272,
      size: 10,
      font: font,
      color: rgb(0, 0, 0)
    });

    // ID number - place on the line after "OF ID"
    page1.drawText(borrower.idNumber, {
      x: 330,
      y: page1Height - 272,
      size: 10,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Date (centered below DATED)
    const dateText = formatDateShort(issueDate);
    const dateTextWidth = font.widthOfTextAtSize(dateText, 10);
    page1.drawText(dateText, {
      x: (page1Width - dateTextWidth) / 2,
      y: page1Height - 306,
      size: 10,
      font: font,
      color: rgb(0, 0, 0)
    });

    // PAGE 2: Fill in agreement details
    const page2 = pages[1];
    const { height: page2Height } = page2.getSize();

    // Date at top of page 2 - after the dots
    page2.drawText(formatDateShort(issueDate), {
      x: 260,
      y: page2Height - 74,
      size: 9,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Borrower name in party section - on the line with dots
    page2.drawText(borrower.fullName.toUpperCase(), {
      x: 40,
      y: page2Height - 192,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // ID number - after "of ID number:"
    page2.drawText(borrower.idNumber, {
      x: 290,
      y: page2Height - 192,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Phone number - after "Phone Number"
    page2.drawText(borrower.phoneNumber, {
      x: 415,
      y: page2Height - 192,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // ID number in WHEREAS section B
    page2.drawText(borrower.idNumber, {
      x: 480,
      y: page2Height - 257,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Loan amount issued - after "Ksh"
    page2.drawText(amountIssued.toLocaleString(), {
      x: 150,
      y: page2Height - 540,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Due date - on the dotted line
    page2.drawText(formatDateShort(dueDate), {
      x: 300,
      y: page2Height - 540,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Total amount to be repaid - after "Amount…Ksh"
    page2.drawText(totalAmount.toLocaleString(), {
      x: 60,
      y: page2Height - 556,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Loan period - in the dotted space
    page2.drawText(`${loan.loanPeriod} week(s)`, {
      x: 140,
      y: page2Height - 620,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // PAGE 3: Fill in collateral details
    const page3 = pages[2];
    const { height: page3Height } = page3.getSize();

    // Collateral item name - adjust x position to start after "Name of the Item: "
    page3.drawText(collateral.itemName, {
      x: 185,
      y: page3Height - 102,
      size: 10,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Model number - adjust to align with the dotted line
    page3.drawText(collateral.modelNumber || 'N/A', {
      x: 185,
      y: page3Height - 118,
      size: 10,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Serial number - adjust to align with the dotted line
    page3.drawText(collateral.serialNumber || 'N/A', {
      x: 185,
      y: page3Height - 134,
      size: 10,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Condition - adjust to align with the dotted line
    page3.drawText(collateral.itemCondition, {
      x: 135,
      y: page3Height - 150,
      size: 10,
      font: font,
      color: rgb(0, 0, 0)
    });

    // PAGE 4: Fill in signature date
    const page4 = pages[3];
    const { height: page4Height } = page4.getSize();

    // Date in certification section - after "on"
    page4.drawText(formatDateShort(issueDate), {
      x: 285,
      y: page4Height - 382,
      size: 10,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Borrower name in certification - after "by……"
    page4.drawText(borrower.fullName.toUpperCase(), {
      x: 235,
      y: page4Height - 397,
      size: 10,
      font: font,
      color: rgb(0, 0, 0)
    });

    // PAGE 5: Fill in statutory declaration
    const page5 = pages[4];
    const { height: page5Height } = page5.getSize();

    // Borrower name in declaration - after "I…" and before "...Of ID Number"
    page5.drawText(borrower.fullName.toUpperCase(), {
      x: 35,
      y: page5Height - 127,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // ID number in declaration - after "Of ID Number…"
    page5.drawText(borrower.idNumber, {
      x: 315,
      y: page5Height - 127,
      size: 8,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Date in declaration - after "This day of……"
    page5.drawText(formatDateShort(issueDate), {
      x: 180,
      y: page5Height - 472,
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
