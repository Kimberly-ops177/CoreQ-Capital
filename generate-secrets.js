/**
 * Security Helper Script
 * 
 * Run this script to generate strong secrets for your production environment
 * 
 * Usage: node generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Core Q Capital - Security Credentials Generator\n');
console.log('='.repeat(60));

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('\n1. JWT_SECRET (Copy to .env):');
console.log('-'.repeat(60));
console.log(jwtSecret);

// Generate API Key
const apiKey = crypto.randomBytes(32).toString('hex');
console.log('\n2. API_KEY (Optional - for API authentication):');
console.log('-'.repeat(60));
console.log(apiKey);

// Generate Session Secret
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('\n3. SESSION_SECRET (Optional - for session management):');
console.log('-'.repeat(60));
console.log(sessionSecret);

// Generate Strong Password Suggestion
const passwordChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
let strongPassword = '';
for (let i = 0; i < 24; i++) {
  strongPassword += passwordChars.charAt(Math.floor(Math.random() * passwordChars.length));
}

console.log('\n4. Strong Password Suggestion (for DB_PASSWORD):');
console.log('-'.repeat(60));
console.log(strongPassword);

console.log('\n' + '='.repeat(60));
console.log('\n⚠️  IMPORTANT SECURITY REMINDERS:');
console.log('   • NEVER commit these secrets to Git');
console.log('   • Store them securely (password manager recommended)');
console.log('   • Use different secrets for dev/staging/production');
console.log('   • Change all default passwords immediately\n');
