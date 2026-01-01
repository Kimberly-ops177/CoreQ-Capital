const nodemailer = require('nodemailer');
const twilio = require('twilio');
const Loan = require('../models/Loan');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

let twilioClient = null;
if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
}

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    });
  } catch (e) {
    console.log('Email send error:', e);
  }
};

const sendSMS = async (to, message) => {
  if (!twilioClient) {
    console.log('SMS not configured - skipping SMS send');
    return;
  }
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
  } catch (e) {
    console.log('SMS send error:', e);
  }
};

const sendReminders = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const loans = await Loan.find({
      dueDate: { $gte: tomorrow, $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) },
      status: 'active'
    }).populate('borrower');

    for (const loan of loans) {
      const borrower = loan.borrower;
      const message = `Reminder: Your loan of Ksh ${loan.amountIssued.toLocaleString()} is due tomorrow. Please make payment to avoid penalties.`;
      await sendEmail(borrower.email, 'Loan Due Reminder', message);
      await sendSMS(borrower.phoneNumber, message);
    }
  } catch (e) {
    console.log('Error sending reminders:', e);
  }
};

module.exports = { sendEmail, sendSMS, sendReminders };