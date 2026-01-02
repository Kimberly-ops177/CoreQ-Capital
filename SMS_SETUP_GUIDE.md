# SMS Notifications Setup Guide - Africa's Talking

## Overview
Your Core Q Capital loan management system now has SMS notification support using Africa's Talking, the leading SMS provider in Kenya.

## What SMS Notifications Are Sent

The system automatically sends SMS reminders at these times:

1. **3 Days Before Due Date**
   - Message: "CORE Q CAPITAL: Your loan of KSH [amount] is due in 3 days ([date]). Paybill: 522533, Account: 7862638. Thank you."

2. **On Due Date (Today)**
   - Message: "CORE Q CAPITAL: Reminder - Your loan of KSH [amount] is due TODAY. Please pay via Paybill 522533, Account: 7862638. Thank you."

3. **1 Week Overdue**
   - Message: "CORE Q CAPITAL: Your loan of KSH [amount] is now 7 days overdue. Total due: KSH [total]. Please contact us or pay via Paybill 522533, Account: 7862638."

## Setup Steps

### Step 1: Create Africa's Talking Account

1. Go to https://africastalking.com
2. Click "Get Started" or "Sign Up"
3. Choose "Kenya" as your country
4. Fill in your details:
   - Company name: Core Q Capital
   - Email: Your professional email
   - Phone: Your phone number
5. Verify your email and phone number

### Step 2: Get API Credentials

1. Log in to your Africa's Talking dashboard
2. Go to "Settings" → "API Key"
3. Generate a new API key (save it securely!)
4. Note your **Username** (usually starts with "sandbox" for testing, changes when you go live)

### Step 3: Add Free Test Credits (Optional)

Africa's Talking provides **FREE test credits** for testing:
1. In the dashboard, look for "Sandbox" or "Test Environment"
2. You'll get free credits to test SMS sending
3. Test SMS can only be sent to phone numbers you've verified

### Step 4: Configure Railway Environment Variables

1. Go to your Railway dashboard
2. Select your **backend** service
3. Go to "Variables" tab
4. Add these environment variables:

```
AFRICASTALKING_USERNAME=your_username_here
AFRICASTALKING_API_KEY=your_api_key_here
AFRICASTALKING_SENDER_ID=COREQ
```

5. Click "Save" - Railway will automatically redeploy

### Step 5: Test SMS Notifications

Once configured, SMS will be sent automatically by the scheduler at 9:00 AM daily.

To test immediately:
1. Set `RUN_NOTIFICATIONS_ON_STARTUP=true` in Railway environment variables
2. Redeploy the backend
3. Check the logs to see SMS sending status

## Going Live (Production)

### When you're ready to send SMS to all customers:

1. **Upgrade Account**
   - In Africa's Talking dashboard, click "Go Live"
   - Complete KYC verification (submit business documents)
   - This usually takes 1-2 business days

2. **Add SMS Credits**
   - Go to "Payments" in the dashboard
   - Add credits via M-Pesa, Card, or Bank Transfer
   - Cost: ~KSH 0.80 per SMS
   - Recommendation: Start with KSH 1,000 (≈1,250 SMS)

3. **Update Your Username**
   - After going live, your username changes from "sandbox" to your actual username
   - Update `AFRICASTALKING_USERNAME` in Railway environment variables

4. **Optional: Get a Sender ID**
   - Apply for an alphanumeric Sender ID (e.g., "COREQ" or "COREQCap")
   - This makes SMS appear from "COREQ" instead of a number
   - Takes 3-5 business days for approval
   - Update `AFRICASTALKING_SENDER_ID` once approved

## How It Works

### Automatic Scheduler
- Runs every day at 9:00 AM (East African Time)
- Checks all approved loans for upcoming due dates
- Sends both **EMAIL** and **SMS** reminders automatically
- Logs all activities in the console

### Phone Number Format
The system automatically formats phone numbers:
- `0712345678` → `+254712345678`
- `712345678` → `+254712345678`
- `+254712345678` → `+254712345678` (no change)

### SMS Message Length
- Each SMS is limited to 160 characters
- Your messages are optimized to fit within 1 SMS
- Longer messages cost more (charged per 160 characters)

## Costs Estimate

Based on your loan volume:

| Loans per Month | SMS Sent | Cost (KSH) |
|----------------|----------|------------|
| 50 loans       | 150 SMS  | ~120       |
| 100 loans      | 300 SMS  | ~240       |
| 200 loans      | 600 SMS  | ~480       |

*Each loan gets 3 reminders: 3-days before, due date, and 1-week overdue*

## Troubleshooting

### SMS not sending?
1. Check Railway logs for errors
2. Verify API credentials are correct
3. Ensure you have SMS credits (check dashboard)
4. Check phone numbers are valid Kenya numbers

### "SMS not configured" in logs?
- The system will log SMS messages in the console but won't actually send them
- This happens when credentials are not set
- Add the environment variables in Railway

### SMS sending but borrowers not receiving?
1. **In Sandbox mode**: Only verified numbers receive SMS
2. **Go Live** to send to all numbers
3. Check if phone numbers in database are correct

## Support

- **Africa's Talking Support**: support@africastalking.com
- **Documentation**: https://developers.africastalking.com/docs/sms/overview

## Next Steps

After SMS is working:
1. Monitor SMS delivery rates in Africa's Talking dashboard
2. Check SMS costs and top up credits as needed
3. Consider upgrading Sender ID for better branding
4. Set up alerts for low SMS credits
