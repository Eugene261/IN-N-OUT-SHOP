// Load environment variables
require('dotenv').config();

const emailService = require('../services/emailService');

console.log('🔍 Email Configuration Diagnostic\n');

// Check environment variables
console.log('📧 Environment Variables:');
console.log('EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER || 'Not set');
console.log('EMAIL_USER:', process.env.EMAIL_USER || 'Not set');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'Not set');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '****** (Set)' : 'Not set');
console.log('SMTP_HOST:', process.env.SMTP_HOST || 'Not set');
console.log('SMTP_PORT:', process.env.SMTP_PORT || 'Not set');
console.log('');

// Check email service initialization
console.log('🚀 Email Service Status:');
try {
  if (emailService.transporter) {
    console.log('✅ Email service transporter initialized');
    
    // Test email connection
    emailService.verifyConnection()
      .then(() => {
        console.log('✅ Email connection verified successfully');
        console.log('');
        console.log('✅ Email configuration appears to be working correctly!');
        console.log('');
        console.log('📝 Recommendations:');
        console.log('1. Make sure EMAIL_FROM matches your authenticated email address');
        console.log('2. If using Gmail, ensure you have an App Password configured');
        console.log('3. Test with: node scripts/test-email.js your-email@example.com');
      })
      .catch((error) => {
        console.log('❌ Email connection failed:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting:');
        
        if (error.message.includes('EAUTH')) {
          console.log('- Authentication failed. Check EMAIL_USER and EMAIL_PASSWORD');
          console.log('- For Gmail: Use App Password, not regular password');
        }
        
        if (error.message.includes('ECONNECTION')) {
          console.log('- Connection failed. Check SMTP_HOST and SMTP_PORT');
          console.log('- Verify internet connection and firewall settings');
        }
        
        if (error.message.includes('5.7.1')) {
          console.log('- Sender address rejected. Ensure EMAIL_FROM matches EMAIL_USER');
          console.log('- Fix: Set EMAIL_FROM=' + (process.env.EMAIL_USER || 'your-authenticated-email@example.com'));
        }
        
        console.log('');
        console.log('📋 Required Environment Variables:');
        console.log('EMAIL_PROVIDER=gmail');
        console.log('EMAIL_USER=your-email@gmail.com');
        console.log('EMAIL_PASSWORD=your-app-password');
        console.log('EMAIL_FROM=your-email@gmail.com  # Must match EMAIL_USER');
      });
      
  } else {
    console.log('❌ Email service not initialized');
    console.log('');
    console.log('🔧 Fix: Set the required environment variables:');
    console.log('EMAIL_PROVIDER=gmail');
    console.log('EMAIL_USER=your-email@gmail.com');
    console.log('EMAIL_PASSWORD=your-app-password');
    console.log('EMAIL_FROM=your-email@gmail.com');
  }
} catch (error) {
  console.log('❌ Email service initialization failed:', error.message);
} 