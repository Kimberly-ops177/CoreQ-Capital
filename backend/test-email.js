require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('\n🔍 Testing Email Configuration for Core Q Capital\n');
console.log('━'.repeat(50));
console.log('Email Service:', process.env.EMAIL_SERVICE || 'Not configured');
console.log('Email User:', process.env.EMAIL_USER || 'Not configured');
console.log('Password Set:', process.env.EMAIL_PASSWORD ? '✓ Yes' : '✗ No');
console.log('━'.repeat(50));
console.log('\nAttempting to send test email...\n');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const testEmail = async () => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.COMPANY_NAME || 'Core Q Capital'}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: '✅ Core Q Capital - Email Configuration Test',
      text: 'Success! If you receive this email, your email configuration is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FFD700 0%, #FFC107 100%); padding: 20px; text-align: center;">
            <h1 style="color: #000; margin: 0;">🏦 Core Q Capital</h1>
          </div>
          <div style="padding: 30px; background-color: #FFFDE7;">
            <h2 style="color: #F57F17;">✅ Email Configuration Successful!</h2>
            <p style="font-size: 16px; color: #212121;">
              Your email configuration is working correctly. The system is now ready to:
            </p>
            <ul style="font-size: 14px; color: #212121;">
              <li>📧 Send loan agreements to borrowers automatically</li>
              <li>⏰ Send due date reminders (1 day before)</li>
              <li>⚠️ Send default notifications after grace period</li>
            </ul>
            <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <h3 style="color: #F57F17; margin-top: 0;">Configuration Details:</h3>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 5px; color: #757575;"><strong>Email Service:</strong></td>
                  <td style="padding: 5px;">${process.env.EMAIL_SERVICE || 'gmail'}</td>
                </tr>
                <tr>
                  <td style="padding: 5px; color: #757575;"><strong>Sender Email:</strong></td>
                  <td style="padding: 5px;">${process.env.EMAIL_USER}</td>
                </tr>
                <tr>
                  <td style="padding: 5px; color: #757575;"><strong>Company Name:</strong></td>
                  <td style="padding: 5px;">${process.env.COMPANY_NAME || 'Core Q Capital'}</td>
                </tr>
              </table>
            </div>
            <div style="margin-top: 20px; padding: 15px; background-color: #E8F5E9; border-left: 4px solid #4CAF50; border-radius: 4px;">
              <strong style="color: #2E7D32;">✓ Next Steps:</strong>
              <p style="margin: 10px 0 0 0; color: #212121;">
                Create a test loan to verify that loan agreements are automatically generated and emailed to borrowers.
              </p>
            </div>
          </div>
          <div style="background-color: #FFD700; padding: 15px; text-align: center; font-size: 12px; color: #000;">
            <p style="margin: 0;">Core Q Capital Loan Management System</p>
            <p style="margin: 5px 0 0 0;">Automated Email Notification System</p>
          </div>
        </div>
      `
    });

    console.log('✅ SUCCESS! Email sent successfully!\n');
    console.log('━'.repeat(50));
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info) || 'N/A');
    console.log('━'.repeat(50));
    console.log('\n📬 Check your inbox:', process.env.EMAIL_USER);
    console.log('💡 If not in inbox, check spam/junk folder\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ FAILED! Email could not be sent\n');
    console.log('━'.repeat(50));
    console.error('Error:', error.message);
    console.log('━'.repeat(50));
    console.log('\n🔧 Troubleshooting Steps:\n');

    if (error.message.includes('Invalid login')) {
      console.log('1. ⚠️  You may be using your regular Gmail password');
      console.log('   → Generate an App Password: https://myaccount.google.com/apppasswords');
      console.log('   → Update EMAIL_PASSWORD in .env with the 16-character app password\n');
    } else if (error.message.includes('Connection timeout') || error.message.includes('ECONNREFUSED')) {
      console.log('1. ⚠️  Cannot connect to email server');
      console.log('   → Check your internet connection');
      console.log('   → Verify EMAIL_SERVICE is correct in .env');
      console.log('   → Check if firewall is blocking port 587\n');
    } else if (error.message.includes('Missing credentials')) {
      console.log('1. ⚠️  Email credentials not configured');
      console.log('   → Set EMAIL_USER in .env file');
      console.log('   → Set EMAIL_PASSWORD in .env file\n');
    } else {
      console.log('1. Check .env file configuration');
      console.log('2. Verify EMAIL_USER and EMAIL_PASSWORD are correct');
      console.log('3. See EMAIL_CONFIGURATION_GUIDE.md for detailed setup\n');
    }

    process.exit(1);
  }
};

testEmail();
