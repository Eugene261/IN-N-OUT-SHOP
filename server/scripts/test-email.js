require('dotenv').config();
const emailService = require('../services/emailService');

async function testEmailConfiguration() {
    console.log('🚀 Testing Email Configuration...\n');
    
    // Check if email environment variables are set
    const requiredVars = ['EMAIL_PROVIDER'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => console.error(`   - ${varName}`));
        console.log('\n📖 Please check EMAIL_SETUP.md for configuration instructions');
        process.exit(1);
    }
    
    console.log(`📧 Email Provider: ${process.env.EMAIL_PROVIDER}`);
    console.log(`📤 Email From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Not set'}`);
    
    try {
        // Test email connection
        console.log('\n🔍 Verifying email connection...');
        await emailService.verifyConnection();
        console.log('✅ Email connection verified successfully!');
        
        // Get test email from command line argument
        const testEmail = process.argv[2];
        if (!testEmail) {
            console.log('\n💡 To send a test email, run:');
            console.log('   node scripts/test-email.js your-email@example.com');
            console.log('\n🎉 Email service is configured correctly!');
            return;
        }
        
        // Validate email format
        if (!/^\S+@\S+\.\S+$/.test(testEmail)) {
            console.error('❌ Invalid email format');
            process.exit(1);
        }
        
        console.log(`\n📮 Sending test email to: ${testEmail}`);
        
        const result = await emailService.sendEmail({
            to: testEmail,
            subject: 'Test Email - IN-N-OUT Store Configuration',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Email Test</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
                        .content { padding: 30px; }
                        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 4px; margin: 15px 0; }
                        .footer { background: #f8f9fa; padding: 15px; text-align: center; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Email Service Test</h1>
                        </div>
                        <div class="content">
                            <div class="success">
                                <strong>Success!</strong> Your email service is configured correctly.
                            </div>
                            <p>This test email was sent from your IN-N-OUT Store application.</p>
                            <p><strong>Configuration Details:</strong></p>
                            <ul>
                                <li>Provider: ${process.env.EMAIL_PROVIDER}</li>
                                <li>From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}</li>
                                <li>Timestamp: ${new Date().toISOString()}</li>
                            </ul>
                            <p>Your forgot password and welcome email features are now ready to use!</p>
                        </div>
                        <div class="footer">
                            <p>IN-N-OUT Store Email Service Test</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
        
        console.log('✅ Test email sent successfully!');
        console.log(`📧 Message ID: ${result.messageId}`);
        console.log('\n🎉 Email service is working correctly!');
        
    } catch (error) {
        console.error('\n❌ Email configuration test failed:');
        console.error(`   Error: ${error.message}`);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('   1. Check your environment variables in .env file');
        console.log('   2. Verify your email provider credentials');
        console.log('   3. For Gmail, ensure you\'re using an App Password');
        console.log('   4. Check EMAIL_SETUP.md for detailed instructions');
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Test interrupted by user');
    process.exit(0);
});

// Run the test
testEmailConfiguration().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
}); 