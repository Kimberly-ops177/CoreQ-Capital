const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');
const { sendEmail } = require('./notificationService');

/**
 * Generate loan agreement DOCX using the Word template and filling in borrower details
 * This approach eliminates all overlapping issues by using proper Word mail merge
 */
const generateLoanAgreementDOCX = async (loan, borrower, collateral) => {
  try {
    // Define paths
    const templatePath = path.join(__dirname, '../templates/loan_agreement_template.docx');
    const uploadsDir = path.join(__dirname, '../uploads/agreements');

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      console.error('Template file not found at:', templatePath);
      console.error('Please place your Word template in backend/templates/ folder and name it "loan_agreement_template.docx"');
      throw new Error('Word template not found. Please add the template file to backend/templates/loan_agreement_template.docx');
    }

    // Load the Word template
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

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

    // Prepare data for template
    const templateData = {
      // Basic borrower information
      loanId: loan.loanId || loan.id.toString(),
      borrowerName: borrower.fullName.toUpperCase(),
      idNumber: borrower.idNumber,
      phoneNumber: borrower.phoneNumber,
      emergencyContact: borrower.emergencyContact || 'N/A',
      emergencyPhone: borrower.emergencyPhone || 'N/A',

      // Address information
      location: borrower.location || 'N/A',
      apartmentName: borrower.apartmentName || 'N/A',
      houseNo: borrower.houseNo || 'N/A',

      // Student-specific fields (show N/A if not applicable)
      institution: borrower.institution || 'N/A',
      regNumber: borrower.regNumber || 'N/A',

      // Loan details
      date: formatDateShort(issueDate),
      loanAmount: amountIssued.toLocaleString(),
      interestRate: `${loan.interestRate}%`,
      totalAmount: totalAmount.toLocaleString(),
      dueDate: formatDateShort(dueDate),
      loanPeriod: `${loan.loanPeriod} week(s)`,

      // Collateral information
      itemName: collateral.itemName,
      modelNumber: collateral.modelNumber || 'N/A',
      serialNumber: collateral.serialNumber || 'N/A',
      itemCondition: collateral.itemCondition,
    };

    // Fill the template with data
    doc.setData(templateData);

    // Render the document (replace all placeholders)
    try {
      doc.render();
    } catch (error) {
      console.error('Error rendering document:', error);
      throw new Error(`Template rendering failed: ${error.message}`);
    }

    // Generate the filled document
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // Save the filled DOCX
    const filename = `loan_agreement_${loan.id}_${Date.now()}.docx`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, buf);

    console.log(`Loan agreement DOCX generated: ${filename}`);
    console.log(`Loan agreement DOCX generated at ${filepath} for loan #${loan.id}`);

    return { filepath, filename };

  } catch (error) {
    console.error('Error generating loan agreement DOCX:', error);
    throw error;
  }
};

/**
 * Send loan agreement email with DOCX attachment to borrower
 */
const sendLoanAgreementEmail = async (loan, borrower, docxPath) => {
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
    const result = await sendEmail(borrower.email, emailSubject, emailHTML, docxPath);
    console.log(`Loan agreement email sent to ${borrower.email}`);
    return result;
  } catch (error) {
    console.error(`Error sending loan agreement email:`, error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateLoanAgreementDOCX,
  sendLoanAgreementEmail
};
