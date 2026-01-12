/**
 * Loan Agreement Service - Form Field Filling Method
 *
 * This service uses PDF form fields for filling data instead of coordinate-based overlay.
 * Benefits:
 * - No more overlapping issues
 * - Text automatically fits in designated areas
 * - Much easier to maintain
 * - Professional appearance
 */

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { sendEmail } = require('./notificationService');

/**
 * Generate loan agreement PDF using form field filling
 */
const generateLoanAgreementPDF = async (loan, borrower, collateral) => {
  try {
    // Define paths - use the form template
    const templatePath = path.join(__dirname, '../templates/loan_agreement_form_template.pdf');
    const uploadsDir = path.join(__dirname, '../uploads/agreements');

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Check if form template exists
    if (!fs.existsSync(templatePath)) {
      console.error('Form template not found at:', templatePath);
      console.error('Please run: node backend/create-form-template.js');
      throw new Error('PDF form template not found. Run create-form-template.js first.');
    }

    // Load the form template PDF
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Get the form
    const form = pdfDoc.getForm();

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

    console.log('Filling form fields with loan data...');

    // PAGE 1 FIELDS
    form.getTextField('loan_id').setText(loan.loanId || loan.id.toString());
    form.getTextField('borrower_name_p1').setText(borrower.fullName.toUpperCase());
    form.getTextField('id_number_p1').setText(borrower.idNumber);
    form.getTextField('date_p1').setText(formatDateShort(issueDate));

    // PAGE 2 FIELDS
    form.getTextField('date_top_p2').setText(formatDateShort(issueDate));
    form.getTextField('borrower_name_p2').setText(borrower.fullName.toUpperCase());
    form.getTextField('id_number_p2').setText(borrower.idNumber);
    form.getTextField('phone_number').setText(borrower.phoneNumber);
    form.getTextField('id_number_whereas').setText(borrower.idNumber);
    form.getTextField('loan_amount').setText(amountIssued.toLocaleString());
    form.getTextField('due_date').setText(formatDateShort(dueDate));
    form.getTextField('total_amount').setText(totalAmount.toLocaleString());
    form.getTextField('loan_period').setText(`${loan.loanPeriod} week(s)`);

    // PAGE 3 FIELDS (Collateral)
    form.getTextField('item_name').setText(collateral.itemName);
    form.getTextField('model_number').setText(collateral.modelNumber || 'N/A');
    form.getTextField('serial_number').setText(collateral.serialNumber || 'N/A');
    form.getTextField('condition').setText(collateral.itemCondition);

    // PAGE 4 FIELDS
    form.getTextField('date_p4').setText(formatDateShort(issueDate));
    form.getTextField('borrower_name_p4').setText(borrower.fullName.toUpperCase());

    // PAGE 5 FIELDS
    form.getTextField('borrower_name_p5').setText(borrower.fullName.toUpperCase());
    form.getTextField('id_number_p5').setText(borrower.idNumber);
    form.getTextField('date_p5').setText(formatDateShort(issueDate));

    console.log('Flattening PDF to prevent editing...');
    // CRITICAL: Flatten the form to make it look like a normal document
    // This prevents users from editing fields and removes field highlighting
    form.flatten();

    // Save the filled PDF
    const pdfBytes = await pdfDoc.save();
    const filename = `loan_agreement_${loan.id}_${Date.now()}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, pdfBytes);

    console.log(`✅ Loan agreement PDF generated: ${filename}`);
    console.log(`   Path: ${filepath}`);
    console.log(`   Loan ID: ${loan.loanId || loan.id}`);
    console.log(`   Borrower: ${borrower.fullName}`);

    return { filepath, filename };

  } catch (error) {
    console.error('❌ Error generating loan agreement PDF:', error);
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
