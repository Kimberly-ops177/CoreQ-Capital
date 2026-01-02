const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { sendEmail } = require('./notificationService');

/**
 * Generate loan agreement PDF with borrower and loan details
 * Based on the Core Q Capital loan agreement template
 */
const generateLoanAgreementPDF = async (loan, borrower, collateral) => {
  return new Promise((resolve, reject) => {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads/agreements');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const filename = `loan_agreement_${loan.id}_${Date.now()}.pdf`;
      const filepath = path.join(uploadsDir, filename);

      // Create PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const writeStream = fs.createWriteStream(filepath);

      doc.pipe(writeStream);

      // Calculate loan details
      const issueDate = new Date(loan.dateIssued);
      const dueDate = new Date(loan.dueDate);
      const interestAmount = parseFloat(loan.amountIssued) * (parseFloat(loan.interestRate) / 100);
      const totalAmount = parseFloat(loan.totalAmount);

      // Format dates
      const formatDate = (date) => {
        return date.toLocaleDateString('en-KE', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      };

      // ===== PAGE 1: COVER PAGE =====

      // Top right: Borrower Photo Placeholder Box
      const photoBoxX = doc.page.width - 150;
      const photoBoxY = 60;
      const photoBoxSize = 100;

      doc.rect(photoBoxX, photoBoxY, photoBoxSize, photoBoxSize)
        .stroke();
      doc.fontSize(8).font('Helvetica')
        .text('BORROWER PHOTO', photoBoxX, photoBoxY + photoBoxSize + 5, {
          width: photoBoxSize,
          align: 'center'
        });

      // Header - Company Branding
      doc.fontSize(10).font('Helvetica')
        .text('A PARTNER YOU CAN TRUST', 50, 50, { align: 'left' });

      doc.moveDown(0.5);
      doc.fontSize(18).font('Helvetica-Bold')
        .text('CORE Q CAPITAL', { align: 'left' });

      doc.fontSize(10).font('Helvetica')
        .text('LOAN AGREEMENT', { align: 'left' });

      doc.moveDown(3);

      // Between section
      doc.fontSize(14).font('Helvetica').text('Between', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica-Bold')
        .text('CORE Q CAPITAL ENTERPRISES', { align: 'center' });
      doc.fontSize(14).font('Helvetica')
        .text('&', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`NAME: ${borrower.fullName.toUpperCase()}    OF ID`, { align: 'center', continued: true });
      doc.moveDown();
      doc.fontSize(12).text(`OF ID: ${borrower.idNumber}`, { align: 'center' });
      doc.moveDown();

      // Borrower's Photo section
      doc.fontSize(10).text('BORROWER\'S PHOTO', { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(14).text(`DATED: ${formatDate(issueDate)}`, { align: 'center' });

      doc.addPage();

      // ===== PAGE 2: AGREEMENT DETAILS =====
      // Page header
      doc.fontSize(10).font('Helvetica-Bold')
        .text('CORE Q CAPITAL', 50, 50);
      doc.fontSize(8).font('Helvetica')
        .text('LOAN AGREEMENT', 50, 65);
      doc.moveDown(2);

      // Agreement details
      doc.fontSize(11).font('Helvetica');

      doc.text(`THIS AGREEMENT is made on ${formatDate(issueDate)} between:`);
      doc.moveDown();

      doc.text('CORE Q CAPITAL (represented by the directors MR. Fidelis Simati-MD, and MR. Mukonzo Evans resident within Nairobi in the Republic of Kenya (hereinafter called "Lender").');
      doc.moveDown();
      doc.text('AND');
      doc.moveDown();
      doc.text(`${borrower.fullName} of ID number ${borrower.idNumber}, Phone Number ${borrower.phoneNumber}${borrower.email ? `, Email ${borrower.email}` : ''} within the Republic of Kenya (hereinafter called "borrower).`);
      doc.moveDown(2);

      // WHEREAS clauses
      doc.fontSize(12).font('Helvetica-Bold').text('WHEREAS');
      doc.fontSize(11).font('Helvetica').moveDown();

      doc.text('WHEREAS the lender is a business incorporated under the Company\'s Act of Kenya as Core Q Capital having the legal capacity to enter into a legally binding agreement that is enforceable by law.');
      doc.moveDown();

      let whereClause2 = `WHEREAS the second is an adult of sound mind having the legal capacity to enter into a legally binding contract`;
      if (borrower.isStudent) {
        whereClause2 += `, studying at ${borrower.institution || '[INSTITUTION]'} and of registration no ${borrower.registrationNumber || '[REG NO]'}`;
      }
      whereClause2 += `, ID number ${borrower.idNumber}, phone no ${borrower.phoneNumber}`;
      if (borrower.emergencyNumber) {
        whereClause2 += `, Emergency No. ${borrower.emergencyNumber}`;
      }
      whereClause2 += `, resident within ${borrower.location}`;
      if (borrower.apartment) {
        whereClause2 += `, Apartment Name ${borrower.apartment}`;
      }
      if (borrower.houseNumber) {
        whereClause2 += `, House No. ${borrower.houseNumber}`;
      }
      whereClause2 += '.';

      doc.text(whereClause2);
      doc.moveDown();

      doc.text('WHEREAS the parties herein are desirous of entering into a security agreement to secure a loan which the lender will advance to the borrower.');
      doc.moveDown();
      doc.text('WHEREAS parties have desired to have the agreement reduced into writing with an intention of creating a legally binding and enforceable relationship;');
      doc.moveDown(2);

      // NOW IT IS HEREBY MUTUALLY AGREED
      doc.fontSize(12).font('Helvetica-Bold').text('NOW IT IS HEREBY MUTUALLY AGREED AS FOLLOWS:');
      doc.fontSize(11).font('Helvetica').moveDown();

      // A. PARTICULARS OF THE PARTIES
      doc.font('Helvetica-Bold').text('A. PARTICULARS OF THE PARTIES');
      doc.font('Helvetica').moveDown();
      doc.text('Core Q is a Company incorporated under the Company\'s Act 2015 dealing in the business of advancing loans in exchange of collateral items.');
      doc.moveDown();
      doc.text('The Borrower is an adult of sound mind and is desirous of acquiring a loan from the lender in exchange for collateral.');
      doc.moveDown(2);

      // B. CREDIT ADVANCE
      doc.font('Helvetica-Bold').text('B. CREDIT ADVANCE');
      doc.font('Helvetica').moveDown();
      doc.text(`The lender has issued to the borrower a loan worth Kshs ${parseFloat(loan.amountIssued).toLocaleString()} only to be repaid before ${formatDate(dueDate)}. Amount KSH ${totalAmount.toLocaleString()} to the account details provided herein.`);
      doc.moveDown();
      doc.text('Payments Details: Pay bill No. 522533');
      doc.text('                  Account: 7862638');
      doc.moveDown();
      doc.text(`Loan Period: ${loan.loanPeriod} week(s)`);
      doc.moveDown();

      // Interest rates
      doc.text('If the period is within one week then there will be an interest of 20% on the principal amount loaned.');
      doc.text('If the period is within two weeks there will be an interest of 28% on the principal amount loaned.');
      doc.text('If the period is within three weeks then there will be an interest of 32% on the principal amount loaned.');
      doc.text('If the period is within four weeks (one month) then there will be an interest of 35% on the principal amount loaned.');
      if (loan.isNegotiable) {
        doc.text(`If the period exceeds one month, the interest is negotiated to ${loan.interestRate}% of the principal amount.`);
      }
      doc.moveDown(2);

      // C. COLLATERAL
      doc.font('Helvetica-Bold').text('C. COLLATERAL');
      doc.font('Helvetica').moveDown();
      doc.text('The Borrower is to deposit a collateral item with the following details:');
      doc.moveDown();
      doc.text(`- Name of the Item: ${collateral.itemName}`);
      doc.text(`- Model Number: ${collateral.modelNumber || 'N/A'}`);
      doc.text(`- Serial Number: ${collateral.serialNumber || 'N/A'}`);
      doc.text(`- Condition: ${collateral.itemCondition}`);
      doc.text(`- Category: ${collateral.category || 'N/A'}`);
      doc.moveDown();

      doc.text('The collateral item is to be assessed by the Lender to ensure that the item is in good shape. The borrower should have receipts or any other documents proving ownership of the collateral item. However, in the absence of the receipts, they should sign a statutory declaration/affidavit of ownership stating that the collateral item belongs to them.');
      doc.moveDown(2);

      doc.addPage();

      // ===== PAGE 3: TERMS AND CONDITIONS =====
      // Page header
      doc.fontSize(10).font('Helvetica-Bold')
        .text('CORE Q CAPITAL', 50, 50);
      doc.fontSize(8).font('Helvetica')
        .text('LOAN AGREEMENT', 50, 65);
      doc.moveDown(2);

      // D. BREACH AND TERMINATION
      doc.font('Helvetica-Bold').text('D. BREACH AND TERMINATION');
      doc.font('Helvetica').moveDown();
      doc.text('It will amount to a breach if either party fails to honour their obligations as listed below:');
      doc.moveDown();
      doc.text('The Borrower shall be charged 3% of the borrowed sum daily succeeding the due date for 7 days, Failure to which the lender shall consider it as default of payment.');
      doc.moveDown();
      doc.text('The borrower shall be charged 5% of the borrowed sum weekly for storage, succeeding a week of the loan settlement.');
      doc.moveDown();
      doc.text('The Borrower shall promptly notify the Lender of any event that is likely to inhibit the disbursement of the sum as agreed in default of which the borrower shall have forfeited ownership of the collateral item.');
      doc.moveDown(2);

      // E. SERVICE OF NOTICES
      doc.font('Helvetica-Bold').text('E. SERVICE OF NOTICES');
      doc.font('Helvetica').moveDown();
      doc.text('Notice may be sent by mobile enabled messaging applications to the party\'s last known and used telephone number. Notice shall be deemed served on the day which it is sent. Service shall be deemed to have been affected when the sender receives a delivery report.');
      doc.moveDown(2);

      // F. DISPUTE RESOLUTION
      doc.font('Helvetica-Bold').text('F. DISPUTE RESOLUTION');
      doc.font('Helvetica').moveDown();
      doc.text('Any dispute or question in connection with the agreement shall be in the first instance resolved amicably failure to which parties shall be at liberty to seek recourse through Alternative Dispute Resolution, and Arbitration. If these measures fail, then the parties have the right to seek recourse in courts of competent Jurisdiction in the Republic of Kenya.');
      doc.moveDown(2);

      // G. EXCLUSIVITY OF LIABILITY AND INDEMNITY
      doc.font('Helvetica-Bold').text('G. EXCLUSIVITY OF LIABILITY AND INDEMNITY');
      doc.font('Helvetica').moveDown();
      doc.text('The Lender shall not be liable for any act or omission pertaining to stolen collateral items or causation of the business that results in an action by third party over the activities of the business whether in contract, warranty, tort, or in any other manner and the borrower shall indemnify the lender for any loss suffered and attribute to the Borrower\'s breach of terms of the agreement.');
      doc.moveDown(2);

      // H. GOVERNING LAW
      doc.font('Helvetica-Bold').text('H. GOVERNING LAW');
      doc.font('Helvetica').moveDown();
      doc.text('The agreement shall be governed and construed in accordance with the Laws of Kenya.');
      doc.moveDown(2);

      // I. ASSIGNMENT
      doc.font('Helvetica-Bold').text('I. ASSIGNMENT');
      doc.font('Helvetica').moveDown();
      doc.text('The rights of the Lender under this agreement shall be transferred to, assigned and enforced to his or her nominee or personal representative in the event of his /her imprisonment, death, and bankruptcy, mental or physical incapacity.');
      doc.moveDown(2);

      // J. ENTIRE AGREEMENT
      doc.font('Helvetica-Bold').text('J. ENTIRE AGREEMENT');
      doc.font('Helvetica').moveDown();
      doc.text('This agreement contains the whole agreement and understanding between the parties over the sale of the contract party herein and supersedes all previous agreements whether oral or written between the parties in respect of such matter which previous agreements are hereby expressly excluded.');
      doc.moveDown(3);

      doc.addPage();

      // ===== PAGE 4: SIGNATURES =====
      // Page header
      doc.fontSize(10).font('Helvetica-Bold')
        .text('CORE Q CAPITAL', 50, 50);
      doc.fontSize(8).font('Helvetica')
        .text('LOAN AGREEMENT', 50, 65);
      doc.moveDown(2);

      // Signatures
      doc.fontSize(12).font('Helvetica-Bold').text('IN WITNESS WHEREOF the parties hereto have hereunto set their respective hands the day, month and year first hereinbefore written:');
      doc.moveDown(2);

      doc.fontSize(11).font('Helvetica');
      doc.text('Signed by the said CORE Q CAPITAL');
      doc.moveDown();
      doc.text('DIRECTORS:');
      doc.moveDown();
      doc.text('MUKONZO EVANS       ) ……………………………………');
      doc.text('FIDELIS SIMATI      ) ……………………………………');
      doc.moveDown(2);

      doc.text('In the presence of');
      doc.text('ADVOCATE: ……………………………………');
      doc.moveDown(3);

      doc.text(`Signed by the said ${borrower.fullName.toUpperCase()}`);
      doc.moveDown();
      doc.text('                    ) ……………………………………');
      doc.moveDown(2);

      doc.text('In the presence of');
      doc.moveDown();
      doc.text('Name: ……………………………………');
      doc.text('Sign: ……………………………………');
      doc.moveDown(3);

      // Footer
      doc.fontSize(10).text('DRAWN BY');
      doc.moveDown();
      doc.text('ORIRI & ASSOCIATE LAW ADVOCATES');
      doc.text('P.O.BOX 37367-00100');
      doc.text('NAIROBI');
      doc.text('Email: katesheila23@gmail.com');

      // Finalize PDF
      doc.end();

      writeStream.on('finish', () => {
        console.log(`Loan agreement PDF generated: ${filename}`);
        resolve({ filepath, filename });
      });

      writeStream.on('error', (error) => {
        console.error('Error writing PDF:', error);
        reject(error);
      });

    } catch (error) {
      console.error('Error generating loan agreement PDF:', error);
      reject(error);
    }
  });
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

  const emailSubject = `Your Loan Agreement - Core Q Capital (Loan #${loan.id})`;
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FFD700; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .amount { font-size: 24px; color: #F57F17; font-weight: bold; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
        .important { background-color: #FFF3CD; padding: 15px; border-left: 4px solid: #FFC107; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏦 Core Q Capital</h1>
          <p>A Partner You Can Trust</p>
        </div>
        <div class="content">
          <h2>Loan Agreement - Action Required</h2>
          <p>Dear ${borrower.fullName},</p>

          <p>Your loan has been successfully processed! Please find your loan agreement attached to this email.</p>

          <div class="important">
            <h3>Loan Details:</h3>
            <ul>
              <li><strong>Loan Amount:</strong> KSH ${parseFloat(loan.amountIssued).toLocaleString()}</li>
              <li><strong>Interest Rate:</strong> ${loan.interestRate}%</li>
              <li><strong>Total Amount Due:</strong> <span class="amount">KSH ${totalAmount.toLocaleString()}</span></li>
              <li><strong>Loan Period:</strong> ${loan.loanPeriod} week(s)</li>
              <li><strong>Due Date:</strong> ${dueDate}</li>
            </ul>
          </div>

          <h3>⚠️ Important - Next Steps:</h3>
          <ol>
            <li><strong>Review the attached loan agreement carefully</strong></li>
            <li><strong>Print and sign the agreement</strong> on the designated signature lines</li>
            <li><strong>Scan or take a clear photo</strong> of the signed agreement</li>
            <li><strong>Send the signed copy back to us via:</strong>
              <ul>
                <li>Email: admin@coreqcapital.com</li>
                <li>WhatsApp: [PHONE NUMBER]</li>
                <li>Visit our office</li>
              </ul>
            </li>
          </ol>

          <div class="important">
            <strong>Note:</strong> Your loan is subject to our approval of the signed agreement. Please ensure all signature fields are completed.
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
    // In a real implementation, you would attach the PDF file
    // For now, we'll send the email without attachment
    // You can use nodemailer's attachment feature: attachments: [{ path: pdfPath }]

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
