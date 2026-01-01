# Email Configuration Guide for Core Q Capital

This guide will help you configure email functionality for automated loan agreement delivery and notifications.

## Quick Setup Instructions

### Option 1: Using Gmail (Recommended for Testing)

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to https://myaccount.google.com/security
   - Click on "2-Step Verification"
   - Follow the steps to enable it

2. **Generate an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Core Q Capital"
   - Click "Generate"
   - Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

3. **Update `.env` file**:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-actual-email@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop  # Paste the app password (no spaces)
   COMPANY_NAME=Core Q Capital
   ADMIN_EMAIL=admin@coreqcapital.com
   ```

4. **Restart the backend server**:
   ```bash
   cd backend
   npm start
   ```

### Option 2: Using Another SMTP Service

If you're using a different email provider, update the `.env` file with SMTP settings:

```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
```

Common SMTP providers:
- **Outlook/Office365**: smtp.office365.com (Port: 587)
- **Yahoo**: smtp.mail.yahoo.com (Port: 587)
- **Custom Domain**: Check with your hosting provider

## Testing Email Configuration

### 1. Test Directly via Backend

Create a test script to verify email works:

```javascript
// backend/test-email.js
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const testEmail = async () => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.COMPANY_NAME}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: 'Core Q Capital - Email Test',
      text: 'If you receive this, email configuration is working!',
      html: '<h2>Success!</h2><p>Email configuration is working correctly.</p>'
    });
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
  }
};

testEmail();
```

Run it:
```bash
cd backend
node test-email.js
```

### 2. Test by Creating a Loan

1. Login to the application
2. Navigate to "Loans" and create a new loan
3. Check the borrower's email for the loan agreement PDF
4. Check backend console for success/error messages

## What Gets Sent Automatically

Once configured, the system will automatically send:

### 1. **Loan Agreement PDF** (On Loan Creation)
- **Trigger**: When admin/employee creates a new loan
- **Recipient**: Borrower's email address
- **Content**:
  - Personalized loan agreement PDF attachment
  - Instructions for signing and returning
  - Loan details summary
- **File**: `backend/services/loanAgreementService.js:126`

### 2. **Due Date Reminders** (1 Day Before Due)
- **Trigger**: Daily scheduler at midnight (00:00 EAT)
- **Recipient**: Borrower email + SMS (if configured)
- **Content**:
  - Reminder of upcoming due date
  - Outstanding amount
  - Payment instructions
- **File**: `backend/services/notificationService.js:12`

### 3. **Default Notifications** (After Grace Period)
- **Trigger**: When loan becomes defaulted (7 days after due date)
- **Recipient**: Borrower email + SMS
- **Content**:
  - Default notice
  - Total amount due (including penalties)
  - Contact information for resolution
- **File**: `backend/services/notificationService.js:75`

## Troubleshooting

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"
- **Solution**: You're using your regular Gmail password instead of an App Password
- **Fix**: Follow step 2 above to generate an App Password

### Error: "Connection timeout"
- **Solution**: Firewall or network blocking SMTP ports
- **Fix**:
  - Check if port 587 or 465 is open
  - Try using different network (mobile hotspot)
  - Contact IT/network admin

### Error: "self signed certificate"
- **Solution**: SSL certificate validation issue
- **Fix**: Add to transporter config:
  ```javascript
  tls: {
    rejectUnauthorized: false
  }
  ```

### Email sent but not received
- **Solution**: Check spam/junk folder
- **Fix**:
  - Add sender email to contacts
  - Check email provider's blocked senders list
  - Verify borrower email address is correct

### SMS not working
- **Note**: SMS requires Twilio account (paid service)
- **Workaround**: System will still send emails if SMS fails
- **Check**: `backend/services/notificationService.js` logs for details

## Email Templates Location

All email templates are in: `backend/services/notificationService.js`

You can customize:
- Subject lines
- Email body content
- HTML formatting
- Company branding

## Security Best Practices

✅ **DO:**
- Use App Passwords (not regular passwords)
- Keep `.env` file private (never commit to git)
- Use environment variables in production
- Regularly rotate App Passwords

❌ **DON'T:**
- Share your `.env` file
- Commit passwords to version control
- Use admin email for testing in production
- Disable SSL/TLS verification in production

## Production Deployment

For production environments, consider:

1. **Dedicated Email Service**: Use transactional email service like:
   - SendGrid
   - Amazon SES
   - Mailgun
   - Postmark

2. **Environment Variables**: Set via hosting platform (not `.env` file)

3. **Email Monitoring**: Track delivery rates and bounces

4. **Rate Limiting**: Implement sending limits to avoid spam flags

## Current Configuration Status

Check your current settings:
```bash
cd backend
node -e "require('dotenv').config(); console.log('Email User:', process.env.EMAIL_USER); console.log('Service:', process.env.EMAIL_SERVICE);"
```

## Support

If you continue having issues:
1. Check backend console logs when loan is created
2. Verify borrower has valid email address
3. Test with your own email first
4. Check `backend/services/loanAgreementService.js` for PDF generation errors

---

**Quick Start Checklist:**
- [ ] Generated Gmail App Password
- [ ] Updated `.env` with EMAIL_USER and EMAIL_PASSWORD
- [ ] Restarted backend server
- [ ] Created test loan to verify email delivery
- [ ] Checked borrower email (including spam folder)

Once email is working, loan agreements will be automatically sent to borrowers!
