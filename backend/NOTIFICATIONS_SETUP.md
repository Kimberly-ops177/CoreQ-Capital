# Automated Notifications & Penalties System

This document explains how the automated loan notification and penalty system works according to Section 2.4 of the instructions.

## Overview

The system automatically:
1. **Sends email AND SMS reminders** 1 day before loan due date
2. **Applies 3% daily penalty** during the 7-day grace period
3. **Flags loans as "Defaulted"** after grace period ends
4. **Sends default notifications** when loan becomes defaulted

## Business Rules (Section 2.4)

### Due Date Reminder
- **When**: 1 day before the due date
- **Condition**: Loan is still outstanding (not fully paid)
- **Action**: Send BOTH email AND SMS to borrower
- **Content**:
  - Loan details (amount, due date)
  - Grace period warning
  - Penalty information (3% per day)

### Grace Period
- **Duration**: 7 days after official due date
- **Status**: Loan marked as "pastDue"
- **Penalty**: 3% per day applied to outstanding amount

### Late Fee Penalty
- **Rate**: 3% per day
- **Applied to**: Outstanding amount (Total - Amount Repaid)
- **Period**: During 7-day grace period only
- **Calculation**: Daily, accumulates until loan is paid or defaulted

### Default Status
- **Trigger**: Grace period ends and loan not fully paid
- **Action**:
  - Loan status changed to "Defaulted"
  - Email AND SMS notifications sent
  - Collateral marked for seizure

## System Architecture

### Files Created

1. **services/notificationService.js**
   - `sendEmail()` - Sends email via Nodemailer
   - `sendSMS()` - Sends SMS via Twilio
   - `sendDueDateReminder()` - Sends both email & SMS 1 day before due date
   - `sendDefaultNotification()` - Sends both email & SMS when loan defaults

2. **services/loanStatusService.js**
   - `calculatePenalty()` - Calculates 3% daily penalty
   - `updateLoanStatus()` - Updates loan status based on dates
   - `processAllLoans()` - Main function that processes all loans
   - `getLoansNeedingReminders()` - Gets loans due tomorrow

3. **services/scheduler.js**
   - Initializes cron jobs
   - Runs `processAllLoans()` daily at midnight
   - Runs additional check at noon

## Configuration

### Required Environment Variables

Add these to your `.env` file:

```env
# Email Configuration (Required for email notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# SMS Configuration (Required for SMS notifications)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Email Setup (Gmail)

1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification
4. Create an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated password
   - Use this as `EMAIL_PASSWORD` in .env

### SMS Setup (Twilio)

1. Sign up at https://www.twilio.com
2. Get a phone number from Twilio console
3. Copy your Account SID and Auth Token
4. Add credentials to .env file

**Note**: Without Twilio credentials, SMS will be simulated (logged to console)

## How It Works

### Daily Processing Schedule

The scheduler runs automatically:
- **Midnight (00:00)**: Main daily processing
- **Noon (12:00)**: Additional check
- **On Server Start**: Immediate processing of pending updates

### Processing Flow

```
Daily at Midnight:
├── For each active loan:
│   ├── Check if reminder needed (1 day before due date)
│   │   └── Send email AND SMS
│   ├── Check if in grace period (past due, within 7 days)
│   │   └── Apply 3% daily penalty
│   ├── Update loan status
│   │   ├── active → due (on due date)
│   │   ├── due → pastDue (after due date)
│   │   └── pastDue → defaulted (after grace period)
│   └── If newly defaulted:
│       └── Send default email AND SMS
```

### Loan Status Flow

```
active (before due date)
  ↓
due (on due date)
  ↓
pastDue (1-7 days after due date, 3% penalty per day)
  ↓
defaulted (8+ days after due date)
  ↓
paid (when fully paid at any stage)
```

## Testing

### Test Notification Service

```javascript
// In backend directory
node -e "
const { sendDueDateReminder } = require('./services/notificationService');
const loan = {
  id: 1,
  amountIssued: 10000,
  totalAmount: 12000,
  amountRepaid: 0,
  penalties: 0,
  dueDate: new Date(Date.now() + 86400000) // Tomorrow
};
const borrower = {
  fullName: 'Test Borrower',
  email: 'test@example.com',
  phoneNumber: '+254712345678'
};
sendDueDateReminder(loan, borrower).then(console.log);
"
```

### Test Penalty Calculation

```javascript
node -e "
const { calculatePenalty } = require('./services/loanStatusService');
const loan = {
  totalAmount: 12000,
  amountRepaid: 0,
  penalties: 0,
  dueDate: new Date(Date.now() - 3 * 86400000), // 3 days ago
  gracePeriodEnd: new Date(Date.now() + 4 * 86400000), // 4 days from now
  lastPenaltyDate: null
};
console.log('Penalty:', calculatePenalty(loan));
// Should be: 12000 * 0.03 * 3 = 1080
"
```

### Manual Trigger

To manually run the loan processing:

```javascript
const { processAllLoans } = require('./services/loanStatusService');
processAllLoans().then(results => console.log(results));
```

## Monitoring

### Console Logs

The system logs all activities:
- ✅ Email sent successfully
- ✅ SMS sent successfully
- ⚠️ Email simulation (no credentials)
- ⚠️ SMS simulation (no credentials)
- ❌ Error sending notification
- 📊 Daily processing results

### Check Logs

```bash
# Start server and watch logs
npm start

# You should see:
# "Initializing loan processing scheduler..."
# "Running initial loan processing..."
# "Processing X active loans..."
```

## Troubleshooting

### Emails Not Sending

1. Check EMAIL_USER and EMAIL_PASSWORD in .env
2. Verify Gmail App Password is correct
3. Check console for error messages
4. Test with: `node -e "require('./services/notificationService').sendEmail('test@example.com', 'Test', '<p>Test</p>').then(console.log)"`

### SMS Not Sending

1. Check Twilio credentials in .env
2. Verify phone number format: +254712345678 (with country code)
3. Check Twilio account balance
4. Verify Twilio phone number is active

### Penalties Not Calculating

1. Check loan has correct dueDate and gracePeriodEnd
2. Verify loan is in grace period
3. Check console logs for calculation details
4. Test penalty calculation manually

### Reminders Not Sending

1. Verify loan due date is tomorrow
2. Check borrower has email and phone number
3. Ensure loan is not already paid
4. Check scheduler is running (console logs)

## Production Deployment

### Before Going Live

1. ✅ Configure real email credentials
2. ✅ Configure Twilio account
3. ✅ Test with real borrower data
4. ✅ Verify scheduler is running
5. ✅ Monitor first few days of automated notifications
6. ✅ Set up error alerting

### Environment Variables

Ensure all production .env variables are set:
- Valid EMAIL_USER and EMAIL_PASSWORD
- Valid TWILIO credentials
- Correct timezone (Africa/Nairobi)

## Compliance

This system strictly follows Section 2.4 of the instructions:

✅ **Due Date Reminder**: Email AND SMS 1 day before due date
✅ **Grace Period**: Automatic 7-day grace period
✅ **Late Fee Penalty**: 3% per day during grace period
✅ **Default Status**: Auto-flag as "Defaulted" after grace period

No modifications to these business rules should be made without updating the instructions document.
