const express = require('express');
const emailService = require('../../services/emailService');

const router = express.Router();

// Contact Us Form Handler
router.post('/contact', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required fields'
      });
    }

    // Validate email format
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Prepare contact details
    const contactDetails = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      subject: subject.trim(),
      message: message.trim()
    };

    // Send emails (both admin notification and customer auto-reply)
    await emailService.sendContactUsEmail(contactDetails);

    // Log the contact form submission
    console.log('Contact form submitted:', {
      name: contactDetails.name,
      email: contactDetails.email,
      subject: contactDetails.subject,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Thank you for your message! We will get back to you within 24 hours.',
      referenceId: `#${Date.now().toString().slice(-6)}`
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send your message. Please try again later or contact us directly.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Newsletter Subscription Handler
router.post('/newsletter', async (req, res) => {
  const { email, name } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Send newsletter confirmation email
    await emailService.sendEmail({
      to: email,
      subject: 'Welcome to IN-N-OUT Store Newsletter! 📧',
      html: emailService.getModernEmailTemplate({
        title: 'Newsletter Subscription',
        headerColor: '#6f42c1',
        icon: '📧',
        content: `
          <div class="notification-header">
            <h2>Welcome to our newsletter, ${name || 'Friend'}!</h2>
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
            <a href="${process.env.CLIENT_URL}/unsubscribe?email=${email}" class="button secondary">Unsubscribe</a>
          </div>
        `
      })
    });

    console.log('Newsletter subscription:', { email, name: name || 'Anonymous' });

    res.status(200).json({
      success: true,
      message: 'Successfully subscribed to our newsletter!'
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe. Please try again later.'
    });
  }
});

module.exports = router; 