require('dotenv').config();
const emailService = require('./services/emailService');

async function testContactForm() {
    console.log('🧪 Testing Contact Form Email Functionality...\n');
    
    try {
        // Test contact form submission
        const contactDetails = {
            name: 'John Doe',
            email: 'customer@example.com',
            phone: '+1 (555) 123-4567',
            subject: 'Product Inquiry',
            message: 'Hi, I would like to know more about your premium headphones. Do you offer international shipping? Also, what is your return policy?'
        };
        
        console.log('📧 Sending contact form emails...');
        console.log(`   Customer: ${contactDetails.name} (${contactDetails.email})`);
        console.log(`   Subject: ${contactDetails.subject}`);
        
        // This sends both admin notification and customer auto-reply
        await emailService.sendContactUsEmail(contactDetails);
        
        console.log('✅ Contact form emails sent successfully!');
        console.log('   - Admin notification sent to support team');
        console.log('   - Customer auto-reply sent to customer');
        
        console.log('\n🎯 Test some other email types as well:');
        
        // Test newsletter subscription
        console.log('\n📰 Testing newsletter subscription...');
        await emailService.sendEmail({
            to: 'eugeneopoku74@gmail.com',
            subject: 'Welcome to IN-N-OUT Store Newsletter! 📧',
            html: emailService.getModernEmailTemplate({
                title: 'Newsletter Subscription',
                headerColor: '#6f42c1',
                icon: '📧',
                content: `
                    <div class="notification-header">
                        <h2>Welcome to our newsletter, Friend!</h2>
                        <p>Thank you for subscribing to IN-N-OUT Store updates.</p>
                    </div>
                    
                    <div class="next-steps">
                        <h3>📬 What to Expect</h3>
                        <ul>
                            <li>🆕 New product announcements</li>
                            <li>💰 Exclusive deals and discounts</li>
                            <li>📊 Weekly featured products</li>
                            <li>🎉 Special event notifications</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${process.env.CLIENT_URL}" class="button">Start Shopping</a>
                        <a href="${process.env.CLIENT_URL}/unsubscribe" class="button secondary">Unsubscribe</a>
                    </div>
                `
            })
        });
        console.log('✅ Newsletter subscription email sent!');
        
        // Test low stock alert
        console.log('\n⚠️ Testing low stock alert...');
        await emailService.sendLowStockAlert(
            'eugeneopoku74@gmail.com',
            'Eugene Opoku',
            {
                id: 'prod-123',
                title: 'Premium Wireless Headphones',
                price: 149.99,
                totalStock: 3,
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
            }
        );
        console.log('✅ Low stock alert sent!');
        
        console.log('\n🎉 All email tests completed successfully!');
        console.log('\n📬 Check your Gmail inbox for:');
        console.log('   1. Newsletter subscription confirmation');
        console.log('   2. Low stock alert (admin notification)');
        console.log('   3. Contact form auto-reply (if you used your email)');
        
    } catch (error) {
        console.error('\n❌ Email test failed:', error);
        console.log('\n🔧 Make sure:');
        console.log('   1. Email service is configured correctly');
        console.log('   2. Environment variables are set');
        console.log('   3. Internet connection is working');
    }
}

// Run the test
testContactForm().then(() => {
    console.log('\n✨ Test completed!');
    process.exit(0);
}).catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
}); 