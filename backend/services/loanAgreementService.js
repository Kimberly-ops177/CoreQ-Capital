const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { sendEmail } = require('./notificationService');

/**
 * Generate loan agreement PDF with borrower and loan details
 * Based on the exact Core Q Capital loan agreement template
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
      const totalAmount = parseFloat(loan.totalAmount);

      // Format dates to match template (e.g., "03-Jan-26")
      const formatDateShort = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        const year = String(date.getFullYear()).slice(-2);
        return `${day}-${month}-${year}`;
      };

      // Helper function to add page footer
      const addPageFooter = (pageNum) => {
        const bottomY = doc.page.height - 40;
        doc.rect(50, bottomY - 5, doc.page.width - 100, 30)
          .fillAndStroke('#4A90A4', '#4A90A4');
        doc.fillColor('#FFFFFF')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('CORE Q CAPITAL', 60, bottomY, { continued: false });
        doc.fillColor('#FFFFFF')
          .fontSize(8)
          .text(String(pageNum), doc.page.width - 80, bottomY, { width: 20, align: 'right' });
        doc.fillColor('#000000'); // Reset to black
      };

      // Helper function to add stamp placeholder
      const addStampPlaceholder = (x, y, text = 'AWUOR CATE SHEILA\nADVOCATE\nEmail katesheila23@gmail.com') => {
        doc.save();
        doc.rect(x, y, 120, 60)
          .stroke('#4169E1');
        doc.fontSize(8)
          .fillColor('#4169E1')
          .font('Helvetica-Bold')
          .text(text, x + 5, y + 20, { width: 110, align: 'center' });
        doc.restore();
        doc.fillColor('#000000').font('Helvetica'); // Reset
      };

      // ===== PAGE 1: COVER PAGE =====

      // Loan ID at top left (large, bold number)
      doc.fontSize(32).font('Helvetica-Bold')
        .fillColor('#000000')
        .text(loan.loanId || loan.id.toString(), 50, 70, { align: 'left' });

      // Center everything else
      const centerX = doc.page.width / 2;

      // CQ logo (centered, large)
      doc.fontSize(48).font('Helvetica-Bold')
        .text('CQ', 0, 160, { width: doc.page.width, align: 'center' });

      doc.fontSize(10).font('Helvetica')
        .text('A PARTNER YOU CAN TRUST', 0, 215, { width: doc.page.width, align: 'center' });

      // CORE Q CAPITAL stacked vertically
      doc.fontSize(32).font('Helvetica-Bold')
        .text('CORE Q', 0, 235, { width: doc.page.width, align: 'center' });
      doc.fontSize(32).font('Helvetica-Bold')
        .text('CAPITAL', 0, 270, { width: doc.page.width, align: 'center' });

      // LOAN AGREEMENT with underline
      doc.fontSize(14).font('Helvetica-Bold')
        .text('LOAN AGREEMENT', 0, 320, { width: doc.page.width, align: 'center', underline: true });

      // Horizontal line
      doc.moveTo(100, 355).lineTo(doc.page.width - 100, 355).stroke();

      // Between section
      doc.fontSize(12).font('Helvetica').text('Between', 0, 375, { width: doc.page.width, align: 'center' });
      doc.fontSize(14).font('Helvetica-Bold')
        .text('CORE Q CAPITAL ENTERPRISES', 0, 395, { width: doc.page.width, align: 'center' });
      doc.fontSize(12).font('Helvetica').text('&', 0, 415, { width: doc.page.width, align: 'center' });

      // Borrower name and ID on ONE line
      doc.fontSize(11).font('Helvetica-Bold');
      const borrowerLine = `NAME:  ${borrower.fullName.toUpperCase()}        OF ID:  ${borrower.idNumber}`;
      doc.text(borrowerLine, 50, 440, { width: doc.page.width - 100, align: 'center' });

      // Horizontal line
      doc.moveTo(100, 465).lineTo(doc.page.width - 100, 465).stroke();

      // DATED
      doc.fontSize(11).font('Helvetica-Bold')
        .text('DATED', 0, 485, { width: doc.page.width, align: 'center' });
      doc.fontSize(12).font('Helvetica-Bold')
        .text(formatDateShort(issueDate), 0, 505, { width: doc.page.width, align: 'center' });

      // Horizontal line
      doc.moveTo(100, 530).lineTo(doc.page.width - 100, 530).stroke();

      // BORROWER PHOTO
      doc.fontSize(11).font('Helvetica-Bold')
        .text('BORROWER PHOTO', 0, 555, { width: doc.page.width, align: 'center' });

      // Drawn by section at bottom left
      doc.fontSize(10).font('Helvetica-Bold').text('Drawn by:', 50, doc.page.height - 150);
      doc.fontSize(10).font('Helvetica')
        .text('ORIRI & ASSOCIATE LAW', 50, doc.page.height - 135)
        .text('ADVOCATES.', 50, doc.page.height - 122)
        .text('P.O BOX 37367-00100', 50, doc.page.height - 109)
        .text('NAIROBI', 50, doc.page.height - 96);

      // NO page footer on page 1

      // ===== PAGE 2: AGREEMENT DETAILS =====
      doc.addPage();

      let currentY = 50;
      doc.fontSize(11).font('Helvetica');
      doc.text(`THIS AGREEMENT is made on ………………….${formatDateShort(issueDate)}…………………... between:`, 50, currentY);
      currentY += 30;

      doc.text('1.  CORE Q CAPITAL (represented by the directors MR. Fidelis Simati-MD, and MR. Mukonzo', 50, currentY, { width: 495 });
      currentY = doc.y;
      doc.text('     Evans resident within Nairobi in the Republic of Kenya (hereinafter called "Lender").', 50, currentY, { width: 495 });
      currentY = doc.y + 20;

      doc.font('Helvetica-Bold').text('AND', 50, currentY, { width: 495, align: 'center' });
      currentY += 30;

      doc.font('Helvetica').text(`2.  …${borrower.fullName.toUpperCase()}…….. of ID number: ……${borrower.idNumber}…… Phone`, 50, currentY, { width: 495 });
      currentY = doc.y;
      doc.text(`     Number………${borrower.phoneNumber}………….. within the Republic of Kenya (hereinafter called "borrower").`, 50, currentY, { width: 495 });
      currentY = doc.y + 30;

      doc.fontSize(12).font('Helvetica-Bold').text('WHEREAS', 50, currentY);
      currentY += 25;

      doc.fontSize(11).font('Helvetica');
      doc.text('A.  WHEREAS the lender is a business incorporated under the Company\'s Act of Kenya as Core Q Capital having the legal capacity to enter into a legally binding agreement that is enforceable by law.', 50, currentY, { width: 495 });
      currentY = doc.y + 15;

      doc.text(`B.  WHEREAS the second is an adult of sound mind having the legal capacity to enter into a legally binding contract, studying at…………..and of registration no..…… ID number ${borrower.idNumber} phone Name……House No. ………… ………. No:  ………. I student  within……… JUJA……   Apartment`, 50, currentY, { width: 495 });
      currentY = doc.y + 15;

      doc.text('C.  WHEREAS the parties herein are desirous of entering into a security agreement to secure a loan which the lender will advance to the borrower.', 50, currentY, { width: 495 });
      currentY = doc.y + 15;

      doc.text('D.  WHEREAS parties have desired to have the agreement reduced into writing with an intention of creating a legally binding and enforceable relationship;', 50, currentY, { width: 495 });
      currentY = doc.y + 25;

      doc.fontSize(12).font('Helvetica-Bold').text('NOW IT IS HEREBY MUTUALLY AGREED AS FOLLOWS:', 50, currentY, { underline: true });
      currentY += 25;

      doc.fontSize(11).font('Helvetica-Bold').text('A.  PARTICULARS OF THE PARTIES', 50, currentY);
      currentY += 20;
      doc.font('Helvetica').text('1.  Core Q is a Company incorporated under the Company\'s Act 2015 dealing in the business of advancing loans in exchange of collateral items.', 70, currentY, { width: 475 });
      currentY = doc.y + 10;

      doc.text('2.  The Borrower is an adult of sound mind and is desirous of acquiring a loan from the lender in exchange for collateral.', 70, currentY, { width: 475 });
      currentY = doc.y + 20;

      doc.fontSize(11).font('Helvetica-Bold').text('B.  CREDIT ADVANCE', 70, currentY);
      currentY += 20;
      doc.font('Helvetica').text(`a.  The lender has issued to the borrower a loan worth …Ksh${parseFloat(loan.amountIssued).toLocaleString()}…only to be repaid before …${formatDateShort(dueDate)}... Amount…Ksh${totalAmount.toLocaleString()}……to the account details provided herein.`, 90, currentY, { width: 455 });
      currentY = doc.y + 15;

      doc.font('Helvetica-Bold').text('Payments Details: Pay bill No. 522533', 110, currentY);
      currentY += 15;
      doc.text('Account: 7862638', 170, currentY);
      currentY += 15;
      doc.font('Helvetica').text(`Loan Period ${loan.loanPeriod} week(s)`, 110, currentY);
      currentY += 30;

      doc.font('Helvetica').text('b.  If the period is within one week then there will be an interest of 20% on the principal amount loaned.', 90, currentY, { width: 455 });
      currentY = doc.y + 10;

      doc.text('c.  If the period is within two weeks there will be an interest of 28% on the principal amount loaned.', 90, currentY, { width: 455 });
      currentY = doc.y + 10;

      doc.text('d.  If the period is within One Month then there will be an interest of 35% on the principal amount loaned.', 90, currentY, { width: 455 });
      currentY = doc.y + 10;

      doc.text(`e.  If the period exceeds one Months, the interest negotiated to…………… of the principal amount.`, 90, currentY, { width: 455 });
      currentY = doc.y;

      // Add stamp placeholder on page 2 (bottom right)
      addStampPlaceholder(doc.page.width - 180, doc.page.height - 150);

      // Page footer
      addPageFooter(2);

      // ===== PAGE 3: COLLATERAL AND TERMS =====
      doc.addPage();

      currentY = 50;
      doc.fontSize(11).font('Helvetica-Bold').text('C.  COLLATERAL.', 50, currentY);
      currentY += 20;
      doc.font('Helvetica').text('The Borrower is to deposit a collateral item with the following details:', 50, currentY, { width: 495 });
      currentY = doc.y + 10;

      doc.text(`- Name of the Item: ${collateral.itemName}`, 70, currentY, { width: 475 });
      currentY = doc.y + 5;
      doc.text(`- Model Number: ${collateral.modelNumber || 'N/A'}`, 70, currentY, { width: 475 });
      currentY = doc.y + 5;
      doc.text(`- Serial Number: ${collateral.serialNumber || 'N/A'}`, 70, currentY, { width: 475 });
      currentY = doc.y + 5;
      doc.text(`- Condition: ${collateral.itemCondition}`, 70, currentY, { width: 475 });
      currentY = doc.y + 15;

      doc.font('Helvetica').text('The collateral item is to be assessed by the Lender to ensure that the item is in good shape. The borrower should have receipts or any other documents proving ownership of the collateral item. However, in the absence of the receipts, they should sign a statutory declaration/affidavit of ownership stating that the collateral item belongs to them.', 50, currentY, { width: 495 });
      currentY = doc.y + 20;

      doc.fontSize(11).font('Helvetica-Bold').text('D.  BREACH AND TERMINATION', 70, currentY);
      currentY += 20;
      doc.font('Helvetica').text('It will amount to a breach if either party fails to honour their obligations as listed below:', 50, currentY, { width: 495 });
      currentY = doc.y + 10;

      doc.text('The Borrower shall be charged 3% of the borrowed sum daily succeeding the due date for 7 days, Failure to which the lender shall consider it as default of payment.', 50, currentY, { width: 495 });
      currentY = doc.y + 10;

      doc.text('The borrower shall be charged 5% of the borrowed sum weekly for storage, succeeding a week of the loan settlement.', 50, currentY, { width: 495 });
      currentY = doc.y + 10;

      doc.text('The Borrower shall promptly notify the Lender of any event that is likely to inhibit the disbursement of the sum as agreed in default of which the borrower shall have forfeited ownership of the collateral item.', 50, currentY, { width: 495 });
      currentY = doc.y + 20;

      doc.fontSize(11).font('Helvetica-Bold').text('E.  SERVICE OF NOTICES.', 50, currentY);
      currentY += 20;
      doc.font('Helvetica').text('Notice may be sent by mobile enabled messaging applications to the party\'s last known and used telephone number or email address. Notice shall be deemed served on the day which it is sent. Service shall be deemed to have been affected when the sender receives a delivery report.', 50, currentY, { width: 495 });
      currentY = doc.y + 20;

      doc.fontSize(11).font('Helvetica-Bold').text('F.  DISPUTE RESOLUTION.', 50, currentY);
      currentY += 20;
      doc.font('Helvetica').text('Any dispute or question in connection with the agreement shall be in the first instance resolved amicably failure to which parties shall be at liberty to seek recourse through Alternative Dispute Resolution, and Arbitration. If these measures fail, then the parties have the right to seek recourse in courts of competent Jurisdiction in the Republic of Kenya.', 50, currentY, { width: 495 });
      currentY = doc.y + 20;

      doc.fontSize(11).font('Helvetica-Bold').text('G.  EXCLUSIVITY OF LIABILITY AND INDEMNITY.', 50, currentY);
      currentY += 20;
      doc.font('Helvetica').text('The Lender shall not be liable for any act or omission pertaining to stolen collateral items or causation of the business that results in an action by third party over the activities of the business whether in contract, warranty, tort, or in any other manner and the borrower shall indemnify the lender for any loss suffered and attribute to the Borrower\'s breach of terms of the agreement.', 50, currentY, { width: 495 });
      currentY = doc.y + 20;

      doc.fontSize(11).font('Helvetica-Bold').text('H.  GOVERNING LAW.', 50, currentY);
      currentY += 20;
      doc.font('Helvetica').text('The agreement shall be governed and construed in accordance with the Laws of Kenya.', 50, currentY, { width: 495 });
      currentY = doc.y + 20;

      doc.fontSize(11).font('Helvetica-Bold').text('I.  ASSIGNMENT.', 50, currentY);
      currentY += 20;
      doc.font('Helvetica').text('The rights of the Lender under this agreement shall be transferred to, assigned and enforced to his or her nominee or personal representative in the event of his /her imprisonment, death, and bankruptcy, mental or physical incapacity.', 50, currentY, { width: 495 });
      currentY = doc.y;

      // Add stamp placeholder on page 3 (bottom right)
      addStampPlaceholder(doc.page.width - 180, doc.page.height - 150);

      // Page footer
      addPageFooter(3);

      // ===== PAGE 4: SIGNATURES =====
      doc.addPage();

      currentY = 50;
      doc.fontSize(11).font('Helvetica-Bold').text('J.  ENTIRE AGREEMENT.', 50, currentY);
      currentY += 20;
      doc.font('Helvetica').text('This agreement contains the whole agreement and understanding between the parties over the sale of the contract party herein and supersedes all previous agreements whether oral or written between the parties in respect of such matter which previous agreements are hereby expressly excluded.', 50, currentY, { width: 495 });
      currentY = doc.y + 30;

      doc.fontSize(12).font('Helvetica-Bold').text(`IN WITNESS WHEREOF the parties hereto have hereunto set their respective hands the day, month and year first hereinbefore written:`, 50, currentY, { width: 495 });
      currentY = doc.y + 25;

      doc.fontSize(11).font('Helvetica-Bold').text('Signed by the said CORE Q CAPITAL', 50, currentY);
      currentY += 15;
      doc.font('Helvetica-Bold').text('DIRECTORS:', 50, currentY);
      currentY += 15;
      doc.fontSize(11).font('Helvetica');
      doc.text('MUKONZO EVANS            ) ……………………………………', 50, currentY);
      currentY += 20;
      doc.text('FIDELIS SIMATI           ) ……………………………………', 50, currentY);
      currentY += 30;

      doc.text('In the presence of', 50, currentY);
      currentY += 15;
      doc.font('Helvetica-Bold').text('ADVOCATE', 50, currentY);
      currentY += 15;
      doc.font('Helvetica');
      doc.text(`I CERTIFY that Simati and Mukonzo appeared before me on ………………${formatDateShort(issueDate)}…………… and being identified by……${borrower.fullName.toUpperCase()}……..being known to me acknowledged the above signature or mark to be theirs and they had freely and voluntarily executed this Agreement and understood its contents`, 50, currentY, { width: 495 });
      currentY = doc.y + 25;

      doc.text('Signed ……………………………………', 90, currentY);
      currentY += 15;
      doc.text('        ADVOCATE', 90, currentY);

      // Add stamp placeholder for advocate
      addStampPlaceholder(doc.page.width - 220, currentY - 50);
      currentY += 50;

      doc.fontSize(11).font('Helvetica-Bold').text('Signed by the said', 50, currentY);
      currentY += 15;
      doc.font('Helvetica').text('                    ) ……………………………………', 130, currentY);
      currentY += 30;

      doc.text('In the presence of', 50, currentY);
      currentY += 20;
      doc.text('Name: Fidelis Simati', 90, currentY);
      currentY += 15;
      doc.text('Sign: ……………………………………', 90, currentY);
      currentY += 50;

      doc.fontSize(10).font('Helvetica-Bold').text('DRAWN BY', 50, currentY);
      currentY += 15;
      doc.font('Helvetica').text('ORIRI&ASSOCIATE LAW ADVOCATES.', 50, currentY);
      currentY += 12;
      doc.text('P.O.BOX 37367-00100', 50, currentY);
      currentY += 12;
      doc.text('NAIROBI.', 50, currentY);
      currentY += 15;
      doc.text('Email: ', 50, currentY, { continued: true });
      doc.fillColor('#0000EE').text('katesheila23@gmail.com', { link: 'mailto:katesheila23@gmail.com', underline: true });
      doc.fillColor('#000000');

      // Page footer
      addPageFooter(4);

      // ===== PAGE 5: STATUTORY DECLARATION =====
      doc.addPage();

      currentY = 50;
      // Logo section at top
      doc.fontSize(20).font('Helvetica-Bold').text('CQ', 50, currentY, { continued: true });
      doc.fontSize(18).text(' CORE Q CAPITAL');
      currentY += 25;
      doc.fontSize(10).font('Helvetica').text('A PARTNER YOU CAN TRUST', 50, currentY);
      currentY += 30;

      doc.fontSize(12).font('Helvetica-Bold').text('STATUTORY DECLARATION.', 50, currentY, { underline: true });
      currentY += 35;

      doc.fontSize(11).font('Helvetica');
      doc.text(`I…${borrower.fullName.toUpperCase()}…Of ID Number…${borrower.idNumber}………….,`, 50, currentY, { width: 495 });
      currentY = doc.y + 15;

      doc.text('In the Republic of Kenya, MAKE OATH and declare as follows:', 50, currentY, { width: 495 });
      currentY = doc.y + 20;

      doc.text('1.  THAT, I am an adult of sound mind and hence competent to swear this statutory declaration.', 50, currentY, { width: 495 });
      currentY = doc.y + 15;

      doc.text('2.  THAT, I do solemnly and sincerely declare that the particulars contained herein are true to the best of my knowledge.', 50, currentY, { width: 495 });
      currentY = doc.y + 15;

      doc.text('3.  THAT, I declare that the collateral herein is mine and the borrower is liable whatsoever for any undertaking contrary to the agreement.', 50, currentY, { width: 495 });
      currentY = doc.y + 15;

      doc.text('4.  THAT, I make this declaration conscientiously believing the same to be true and in accordance with the Oaths and Statutory Declarations Act, (Chapter 15 of the Laws of Kenya)', 50, currentY, { width: 495 });
      currentY = doc.y + 30;

      doc.font('Helvetica-Bold').text('DECLARED AT NAIROBI by the said', 50, currentY);
      currentY += 15;
      doc.font('Helvetica').text('……………………………………………………………………………………….', 50, currentY);
      currentY += 12;
      doc.text('……………………………………………………………………………………….', 50, currentY);
      currentY += 20;
      doc.text(`This day of……………${formatDateShort(issueDate)}…………………….`, 50, currentY);
      currentY += 30;

      doc.text('BEFORE ME:                             ( ___________ )', 50, currentY);
      currentY += 30;
      doc.text('COMMISSIONER OF OATHS        )', 50, currentY);

      // Add two stamp placeholders on page 5
      addStampPlaceholder(doc.page.width - 220, 200, 'AWUOR CATE SHEILA\nADVOCATE\nEmail katesheila23@gmail.com');
      addStampPlaceholder(doc.page.width - 220, 350, 'AWUOR CATE SHEILA\nADVOCATE\nEmail katesheila23@gmail.com');

      // Page footer
      addPageFooter(5);

      // Finalize PDF
      doc.end();

      writeStream.on('finish', () => {
        console.log(`Loan agreement PDF generated: ${filename}`);
        console.log(`Loan agreement PDF generated at ${filepath} for loan #${loan.id}`);
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
