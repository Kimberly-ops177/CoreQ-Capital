const nodemailer = require('nodemailer');
const smsService = require('./smsService');

// Email configuration using nodemailer
const createEmailTransporter = () => {
  // Configure with your email service (Gmail, SendGrid, etc.)
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// SMS sending now handled by smsService (Africa's Talking)

/**
 * Send email notification
 */
const sendEmail = async (to, subject, htmlContent) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log(`[EMAIL SIMULATION] To: ${to}, Subject: ${subject}`);
      console.log(`[EMAIL CONTENT]\n${htmlContent}`);
      return { success: true, simulated: true };
    }

    const transporter = createEmailTransporter();
    const mailOptions = {
      from: `"Core Q Capital" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send SMS notification using Africa's Talking
 */
const sendSMS = async (to, message) => {
  try {
    // Use the smsService (Africa's Talking)
    const result = await smsService.sendSMS(to, message);

    if (result.skipped) {
      console.log(`[SMS SIMULATION] To: ${to}, Message: ${message}`);
      return { success: true, simulated: true };
    }

    return result;
  } catch (error) {
    console.error(`Error sending SMS to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send reminder 3 days before due date
 */
const send3DaysBeforeReminder = async (loan, borrower) => {
  const dueDate = new Date(loan.dueDate);
  const formattedDueDate = dueDate.toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const outstandingAmount = parseFloat(loan.totalAmount) - parseFloat(loan.amountRepaid || 0) + parseFloat(loan.penalties || 0);

  const emailSubject = `Loan Payment Reminder - Due in 3 Days`;
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; padding: 20px; text-align: center; color: white; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .amount { font-size: 24px; color: #1976D2; font-weight: bold; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .info { background-color: #E3F2FD; padding: 10px; border-left: 4px solid #2196F3; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏦 Core Q Capital</h1>
        </div>
        <div class="content">
          <h2>Upcoming Loan Payment</h2>
          <p>Dear ${borrower.fullName},</p>

          <p>This is a friendly reminder that your loan payment is due in <strong>3 days</strong>.</p>

          <div class="info">
            <strong>Due Date:</strong> ${formattedDueDate}
          </div>

          <p><strong>Loan Details:</strong></p>
          <ul>
            <li><strong>Principal Amount:</strong> KSH ${parseFloat(loan.amountIssued).toLocaleString()}</li>
            <li><strong>Total Amount Due:</strong> <span class="amount">KSH ${outstandingAmount.toLocaleString()}</span></li>
            <li><strong>Amount Paid:</strong> KSH ${parseFloat(loan.amountRepaid || 0).toLocaleString()}</li>
            <li><strong>Outstanding Balance:</strong> KSH ${outstandingAmount.toLocaleString()}</li>
          </ul>

          <p>Please ensure payment is made on or before the due date to avoid penalties.</p>

          <p>Thank you for your business.</p>

          <p>Best regards,<br>
          <strong>Core Q Capital Team</strong></p>
        </div>
        <div class="footer">
          This is an automated message. Please do not reply to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  const smsMessage = `CORE Q CAPITAL: Your loan of KSH ${parseFloat(loan.amountIssued).toLocaleString()} is due in 3 days (${formattedDueDate}). Paybill: 522533, Account: 7862638. Thank you.`;

  const results = { email: null, sms: null };

  if (borrower.email) {
    results.email = await sendEmail(borrower.email, emailSubject, emailHTML);
  }

  if (borrower.phoneNumber) {
    const phoneNumber = borrower.phoneNumber.startsWith('+')
      ? borrower.phoneNumber
      : `+254${borrower.phoneNumber.replace(/^0/, '')}`;
    results.sms = await sendSMS(phoneNumber, smsMessage);
  }

  return results;
};

/**
 * Send due date reminder (1 day before due date)
 * Per instructions: "automatically send an email and SMS reminder one day before the due date"
 */
const sendDueDateReminder = async (loan, borrower) => {
  const dueDate = new Date(loan.dueDate);
  const formattedDueDate = dueDate.toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const outstandingAmount = parseFloat(loan.totalAmount) - parseFloat(loan.amountRepaid || 0) + parseFloat(loan.penalties || 0);

  // Email content
  const emailSubject = `Loan Payment Reminder - Due Tomorrow`;
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
        .warning { background-color: #FFF3CD; padding: 10px; border-left: 4px solid #FFC107; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏦 Core Q Capital</h1>
        </div>
        <div class="content">
          <h2>Loan Payment Reminder</h2>
          <p>Dear ${borrower.fullName},</p>

          <p>This is a friendly reminder that your loan payment is <strong>due tomorrow</strong>.</p>

          <div class="warning">
            <strong>Due Date:</strong> ${formattedDueDate}
          </div>

          <p><strong>Loan Details:</strong></p>
          <ul>
            <li><strong>Principal Amount:</strong> KSH ${parseFloat(loan.amountIssued).toLocaleString()}</li>
            <li><strong>Total Amount Due:</strong> <span class="amount">KSH ${outstandingAmount.toLocaleString()}</span></li>
            <li><strong>Amount Paid:</strong> KSH ${parseFloat(loan.amountRepaid || 0).toLocaleString()}</li>
            <li><strong>Outstanding Balance:</strong> KSH ${outstandingAmount.toLocaleString()}</li>
          </ul>

          <div class="warning">
            <strong>Important:</strong> A 7-day grace period will be granted after the due date. However, a penalty of 3% per day will be applied to the outstanding amount during this grace period.
          </div>

          <p>Please ensure payment is made on or before the due date to avoid penalties.</p>

          <p>If you have already made the payment, please disregard this message.</p>

          <p>Thank you for your business.</p>

          <p>Best regards,<br>
          <strong>Core Q Capital Team</strong></p>
        </div>
        <div class="footer">
          This is an automated message. Please do not reply to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  // SMS content (shorter version)
  const smsMessage = `CORE Q CAPITAL: REMINDER - Your loan of KSH ${parseFloat(loan.amountIssued).toLocaleString()} is due tomorrow. Paybill: 522533, Account: 7862638. Pay on time to avoid penalties.`;

  // Send both email and SMS as per instructions
  const results = {
    email: null,
    sms: null
  };

  if (borrower.email) {
    results.email = await sendEmail(borrower.email, emailSubject, emailHTML);
  } else {
    console.log(`No email address for borrower ${borrower.fullName}`);
  }

  if (borrower.phoneNumber) {
    // Format phone number for SMS (ensure it has country code)
    const phoneNumber = borrower.phoneNumber.startsWith('+')
      ? borrower.phoneNumber
      : `+254${borrower.phoneNumber.replace(/^0/, '')}`; // Kenya country code

    results.sms = await sendSMS(phoneNumber, smsMessage);
  } else {
    console.log(`No phone number for borrower ${borrower.fullName}`);
  }

  return results;
};

/**
 * Send reminder on the due date
 */
const sendOnDueDateReminder = async (loan, borrower) => {
  const dueDate = new Date(loan.dueDate);
  const formattedDueDate = dueDate.toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const outstandingAmount = parseFloat(loan.totalAmount) - parseFloat(loan.amountRepaid || 0) + parseFloat(loan.penalties || 0);

  const emailSubject = `Loan Payment Due TODAY`;
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF9800; padding: 20px; text-align: center; color: white; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .amount { font-size: 24px; color: #F57C00; font-weight: bold; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .warning { background-color: #FFF3E0; padding: 10px; border-left: 4px solid #FF9800; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏦 Core Q Capital</h1>
        </div>
        <div class="content">
          <h2>Payment Due Today</h2>
          <p>Dear ${borrower.fullName},</p>

          <p>This is a reminder that your loan payment is <strong>DUE TODAY</strong>.</p>

          <div class="warning">
            <strong>Due Date:</strong> ${formattedDueDate} (TODAY)
          </div>

          <p><strong>Loan Details:</strong></p>
          <ul>
            <li><strong>Principal Amount:</strong> KSH ${parseFloat(loan.amountIssued).toLocaleString()}</li>
            <li><strong>Total Amount Due:</strong> <span class="amount">KSH ${outstandingAmount.toLocaleString()}</span></li>
            <li><strong>Amount Paid:</strong> KSH ${parseFloat(loan.amountRepaid || 0).toLocaleString()}</li>
            <li><strong>Outstanding Balance:</strong> KSH ${outstandingAmount.toLocaleString()}</li>
          </ul>

          <div class="warning">
            <strong>Grace Period:</strong> A 7-day grace period is available after today, but a 3% daily penalty will be applied to the outstanding amount.
          </div>

          <p>Please make your payment today to avoid penalties.</p>

          <p>Best regards,<br>
          <strong>Core Q Capital Team</strong></p>
        </div>
        <div class="footer">
          This is an automated message. Please do not reply to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  const smsMessage = `CORE Q CAPITAL: Reminder - Your loan of KSH ${parseFloat(loan.amountIssued).toLocaleString()} is due TODAY. Please pay via Paybill 522533, Account: 7862638. Thank you.`;

  const results = { email: null, sms: null };

  if (borrower.email) {
    results.email = await sendEmail(borrower.email, emailSubject, emailHTML);
  }

  if (borrower.phoneNumber) {
    const phoneNumber = borrower.phoneNumber.startsWith('+')
      ? borrower.phoneNumber
      : `+254${borrower.phoneNumber.replace(/^0/, '')}`;
    results.sms = await sendSMS(phoneNumber, smsMessage);
  }

  return results;
};

/**
 * Send reminder 1 week past due date
 */
const send1WeekPastDueReminder = async (loan, borrower) => {
  const dueDate = new Date(loan.dueDate);
  const formattedDueDate = dueDate.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const outstandingAmount = parseFloat(loan.totalAmount) - parseFloat(loan.amountRepaid || 0) + parseFloat(loan.penalties || 0);

  const emailSubject = `URGENT: Loan Payment 1 Week Overdue`;
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #F44336; padding: 20px; text-align: center; color: white; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .amount { font-size: 24px; color: #D32F2F; font-weight: bold; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .alert { background-color: #FFEBEE; padding: 15px; border-left: 4px solid #F44336; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ URGENT NOTICE</h1>
        </div>
        <div class="content">
          <h2>Payment Overdue</h2>
          <p>Dear ${borrower.fullName},</p>

          <div class="alert">
            <strong>Your loan payment is now 1 WEEK OVERDUE</strong>
          </div>

          <p>Your payment was due on <strong>${formattedDueDate}</strong>, which was 7 days ago.</p>

          <p><strong>Current Outstanding Amount:</strong></p>
          <p class="amount">KSH ${outstandingAmount.toLocaleString()}</p>

          <p><strong>Loan Details:</strong></p>
          <ul>
            <li><strong>Original Amount:</strong> KSH ${parseFloat(loan.totalAmount).toLocaleString()}</li>
            <li><strong>Penalties Accrued:</strong> KSH ${parseFloat(loan.penalties || 0).toLocaleString()}</li>
            <li><strong>Amount Paid:</strong> KSH ${parseFloat(loan.amountRepaid || 0).toLocaleString()}</li>
            <li><strong>Total Outstanding:</strong> <span class="amount">KSH ${outstandingAmount.toLocaleString()}</span></li>
          </ul>

          <div class="alert">
            <strong>Immediate Action Required:</strong> Please contact our office immediately to arrange payment. Continued non-payment may result in loan default and collateral seizure.
          </div>

          <p>Please settle this loan as soon as possible to avoid further penalties and legal action.</p>

          <p><strong>Core Q Capital Team</strong></p>
        </div>
        <div class="footer">
          This is an automated message. Please contact us immediately.
        </div>
      </div>
    </body>
    </html>
  `;

  const smsMessage = `CORE Q CAPITAL: Your loan of KSH ${parseFloat(loan.amountIssued).toLocaleString()} is now 7 days overdue. Total due: KSH ${outstandingAmount.toLocaleString()}. Please contact us or pay via Paybill 522533, Account: 7862638.`;

  const results = { email: null, sms: null };

  if (borrower.email) {
    results.email = await sendEmail(borrower.email, emailSubject, emailHTML);
  }

  if (borrower.phoneNumber) {
    const phoneNumber = borrower.phoneNumber.startsWith('+')
      ? borrower.phoneNumber
      : `+254${borrower.phoneNumber.replace(/^0/, '')}`;
    results.sms = await sendSMS(phoneNumber, smsMessage);
  }

  return results;
};

/**
 * Send default notification (when loan enters defaulted status)
 */
const sendDefaultNotification = async (loan, borrower) => {
  const emailSubject = `URGENT: Loan Defaulted - Action Required`;
  const totalDue = parseFloat(loan.totalAmount) + parseFloat(loan.penalties || 0);
  const outstandingAmount = totalDue - parseFloat(loan.amountRepaid || 0);

  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #D32F2F; padding: 20px; text-align: center; color: white; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .amount { font-size: 24px; color: #D32F2F; font-weight: bold; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .alert { background-color: #FFEBEE; padding: 15px; border-left: 4px solid #D32F2F; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ LOAN DEFAULTED</h1>
        </div>
        <div class="content">
          <h2>Urgent Notice</h2>
          <p>Dear ${borrower.fullName},</p>

          <div class="alert">
            <strong>Your loan has been flagged as DEFAULTED</strong> as payment was not received within the 7-day grace period.
          </div>

          <p><strong>Outstanding Amount:</strong></p>
          <p class="amount">KSH ${outstandingAmount.toLocaleString()}</p>

          <p><strong>Breakdown:</strong></p>
          <ul>
            <li><strong>Original Amount:</strong> KSH ${parseFloat(loan.totalAmount).toLocaleString()}</li>
            <li><strong>Penalties Accrued:</strong> KSH ${parseFloat(loan.penalties || 0).toLocaleString()}</li>
            <li><strong>Amount Paid:</strong> KSH ${parseFloat(loan.amountRepaid || 0).toLocaleString()}</li>
            <li><strong>Total Outstanding:</strong> <span class="amount">KSH ${outstandingAmount.toLocaleString()}</span></li>
          </ul>

          <div class="alert">
            <strong>Immediate Action Required:</strong> Please contact our office immediately to arrange payment and discuss your options.
          </div>

          <p>Failure to settle this loan may result in further action including seizure of collateral.</p>

          <p><strong>Core Q Capital Team</strong></p>
        </div>
        <div class="footer">
          This is an automated message. Please contact us immediately.
        </div>
      </div>
    </body>
    </html>
  `;

  const smsMessage = `CORE Q CAPITAL URGENT: Your loan has been DEFAULTED. Outstanding amount: KSH ${outstandingAmount.toLocaleString()}. Contact us immediately to avoid collateral seizure.`;

  const results = {
    email: null,
    sms: null
  };

  if (borrower.email) {
    results.email = await sendEmail(borrower.email, emailSubject, emailHTML);
  }

  if (borrower.phoneNumber) {
    const phoneNumber = borrower.phoneNumber.startsWith('+')
      ? borrower.phoneNumber
      : `+254${borrower.phoneNumber.replace(/^0/, '')}`;

    results.sms = await sendSMS(phoneNumber, smsMessage);
  }

  return results;
};

module.exports = {
  sendEmail,
  sendSMS,
  send3DaysBeforeReminder,
  sendDueDateReminder,
  sendOnDueDateReminder,
  send1WeekPastDueReminder,
  sendDefaultNotification
};
