/**
 * SMS Service using Africa's Talking API
 * Handles sending SMS notifications for loan reminders
 */

const africastalking = require('africastalking');

// Initialize Africa's Talking client
let smsClient = null;

function initializeSMS() {
  if (!process.env.AFRICASTALKING_USERNAME || !process.env.AFRICASTALKING_API_KEY) {
    console.warn('⚠️  Africa\'s Talking credentials not configured. SMS notifications will be disabled.');
    return null;
  }

  try {
    const client = africastalking({
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME
    });

    smsClient = client.SMS;
    console.log('✅ Africa\'s Talking SMS service initialized');
    return smsClient;
  } catch (error) {
    console.error('❌ Failed to initialize Africa\'s Talking:', error);
    return null;
  }
}

/**
 * Send SMS notification
 * @param {string} phoneNumber - Recipient phone number (format: +254xxxxxxxxx)
 * @param {string} message - SMS message content (max 160 characters for single SMS)
 * @returns {Promise<Object>} - Result object with success status
 */
async function sendSMS(phoneNumber, message) {
  try {
    // Initialize SMS client if not already done
    if (!smsClient) {
      smsClient = initializeSMS();
    }

    // If still no client (missing credentials), return gracefully
    if (!smsClient) {
      console.log('📱 SMS not sent (credentials not configured):', phoneNumber);
      return {
        success: false,
        error: 'SMS service not configured',
        skipped: true
      };
    }

    // Ensure phone number starts with +254 for Kenya
    let formattedPhone = phoneNumber.trim();

    // Remove any spaces or dashes
    formattedPhone = formattedPhone.replace(/[\s-]/g, '');

    // Convert 07xx to +2547xx or 7xx to +2547xx
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
      formattedPhone = '+254' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Validate phone number format
    if (!formattedPhone.match(/^\+254[17]\d{8}$/)) {
      console.error('❌ Invalid phone number format:', phoneNumber);
      return {
        success: false,
        error: 'Invalid phone number format. Expected +254xxxxxxxxx'
      };
    }

    // Send SMS
    const result = await smsClient.send({
      to: [formattedPhone],
      message: message,
      from: process.env.AFRICASTALKING_SENDER_ID || 'COREQCAP' // Optional: Short code or sender ID
    });

    console.log('✅ SMS sent successfully:', {
      to: formattedPhone,
      status: result?.SMSMessageData?.Recipients?.[0]?.status || 'unknown',
      messageId: result?.SMSMessageData?.Recipients?.[0]?.messageId || 'unknown',
      fullResponse: JSON.stringify(result)
    });

    return {
      success: true,
      result: result?.SMSMessageData?.Recipients?.[0] || result
    };

  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send loan reminder SMS - 3 days before due date
 */
async function sendLoanReminder3Days(borrower, loan) {
  const dueDate = new Date(loan.dueDate).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const message = `CORE Q CAPITAL: Dear ${borrower.fullName}, your loan of KSH ${loan.amountIssued.toLocaleString()} is due on ${dueDate}. Paybill: 522533, Account: 7862638. Thank you.`;

  return await sendSMS(borrower.phoneNumber, message);
}

/**
 * Send loan reminder SMS - Due date (today)
 */
async function sendLoanReminderDueDate(borrower, loan) {
  const message = `CORE Q CAPITAL: Reminder - Your loan of KSH ${loan.amountIssued.toLocaleString()} is due TODAY. Please pay via Paybill 522533, Account: 7862638. Thank you.`;

  return await sendSMS(borrower.phoneNumber, message);
}

/**
 * Send loan reminder SMS - 1 week overdue
 */
async function sendLoanReminderOverdue(borrower, loan) {
  const totalDue = loan.totalAmount + (loan.penaltyAmount || 0);

  const message = `CORE Q CAPITAL: Your loan of KSH ${loan.amountIssued.toLocaleString()} is now 7 days overdue. Total due: KSH ${totalDue.toLocaleString()}. Please contact us or pay via Paybill 522533, Account: 7862638.`;

  return await sendSMS(borrower.phoneNumber, message);
}

/**
 * Send custom SMS to borrower
 */
async function sendCustomSMS(phoneNumber, borrowerName, customMessage) {
  const message = `CORE Q CAPITAL: Dear ${borrowerName}, ${customMessage}`;
  return await sendSMS(phoneNumber, message);
}

/**
 * Send loan approval notification SMS
 */
async function sendLoanApprovalSMS(borrower, loan) {
  const dueDate = new Date(loan.dueDate).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const message = `CORE Q CAPITAL: Congratulations ${borrower.fullName}! Your loan of KSH ${loan.amountIssued.toLocaleString()} has been approved. Due date: ${dueDate}. Paybill: 522533, Account: 7862638.`;

  return await sendSMS(borrower.phoneNumber, message);
}

module.exports = {
  initializeSMS,
  sendSMS,
  sendLoanReminder3Days,
  sendLoanReminderDueDate,
  sendLoanReminderOverdue,
  sendCustomSMS,
  sendLoanApprovalSMS
};
