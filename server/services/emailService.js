const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.lastError = null;
    this.initializeTransporter();
  }

  // Enhanced initialization with better error handling
  initializeTransporter() {
    try {
      // Check for required environment variables
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('⚠️ Email service not configured - EMAIL_USER or EMAIL_PASSWORD missing');
        this.isConfigured = false;
        return;
      }

      const provider = (process.env.EMAIL_PROVIDER || 'gmail').toLowerCase();
      console.log(`📧 Initializing email service with provider: ${provider}`);

      let transportConfig = null;

      // Provider-specific configurations with fallbacks
      switch (provider) {
        case 'gmail':
          transportConfig = {
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD
            },
            secure: true,
            tls: {
              rejectUnauthorized: false // For development, remove in production if using proper certs
            }
          };
          break;

        case 'sendgrid':
          if (!process.env.SENDGRID_API_KEY) {
            console.error('❌ SendGrid API key not provided');
            this.isConfigured = false;
            return;
          }
          transportConfig = {
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
              user: 'apikey',
              pass: process.env.SENDGRID_API_KEY
            }
          };
          break;

        case 'mailgun':
          if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
            console.error('❌ Mailgun credentials not provided');
            this.isConfigured = false;
            return;
          }
          transportConfig = {
            host: 'smtp.mailgun.org',
            port: 587,
            secure: false,
            auth: {
              user: `postmaster@${process.env.MAILGUN_DOMAIN}`,
              pass: process.env.MAILGUN_API_KEY
            }
          };
          break;

        case 'outlook':
        case 'hotmail':
          transportConfig = {
            service: 'hotmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD
            },
            secure: true
          };
          break;

        case 'custom':
          if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
            console.error('❌ Custom SMTP configuration incomplete');
            this.isConfigured = false;
            return;
          }
          transportConfig = {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD
            }
          };
          break;

        default:
          console.error(`❌ Unsupported email provider: ${provider}`);
          this.isConfigured = false;
          return;
      }

      // Create transporter with enhanced error handling
      this.transporter = nodemailer.createTransport(transportConfig);
      
      // Verify connection in non-production environments only
      if (process.env.NODE_ENV !== 'production') {
        this.transporter.verify((error, success) => {
          if (error) {
            console.error('❌ Email verification failed:', error.message);
            this.lastError = error;
            this.isConfigured = false;
          } else {
            console.log('✅ Email server is ready to send emails');
            this.isConfigured = true;
          }
        });
      } else {
        // In production, assume configuration is correct to avoid blocking startup
        this.isConfigured = true;
        console.log('✅ Email service initialized (production mode)');
      }

    } catch (error) {
      console.error('❌ Critical error initializing email service:', error);
      this.isConfigured = false;
      this.lastError = error;
    }
  }

  async verifyConnection() {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    try {
      await this.transporter.verify();
      console.log('Email connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email connection verification failed:', error);
      throw error;
    }
  }

  // Enhanced sendEmail with production safety
  async sendEmail(options) {
    // Graceful degradation if email service is not configured
    if (!this.transporter || !this.isConfigured) {
      const errorMsg = this.lastError 
        ? `Email service unavailable: ${this.lastError.message}`
        : 'Email service not configured';
      
      console.warn(`⚠️ ${errorMsg}`);
      
      // In development, log what would have been sent
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 [EMAIL SIMULATION]', {
          to: options.to,
          subject: options.subject,
          timestamp: new Date().toISOString()
        });
      }
      
      // Don't throw error - return success to prevent breaking application flow
      return {
        success: false,
        simulated: true,
        message: errorMsg
      };
    }

    try {
      // Clean, professional headers that don't trigger spam filters
      const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      const cleanFromAddress = fromAddress?.includes('<') ? fromAddress.match(/<(.+)>/)?.[1] : fromAddress;
      
      if (!cleanFromAddress) {
        throw new Error('Email FROM address not configured');
      }
      
      const defaultOptions = {
        from: `"IN-N-OUT Store" <${cleanFromAddress}>`,
        replyTo: process.env.REPLY_TO_EMAIL || cleanFromAddress,
        headers: {
          // Essential headers only
          'X-Mailer': 'IN-N-OUT Store',
          'X-Priority': '3',
          'List-Unsubscribe': `<mailto:unsubscribe@${cleanFromAddress.split('@')[1]}>`,
          'Message-ID': `<${Date.now()}-${Math.random().toString(36)}@${cleanFromAddress.split('@')[1]}>`
        }
      };

      const mailOptions = { ...defaultOptions, ...options };
      
      // Enhanced logging
      console.log(`📧 Sending email to: ${mailOptions.to}`);
      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 Subject: ${mailOptions.subject}`);
      }

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Email sent successfully to: ${mailOptions.to}`);
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };

    } catch (error) {
      console.error('❌ Email sending failed:', {
        to: options.to,
        subject: options.subject,
        error: error.message,
        code: error.code,
        command: error.command
      });

      // Don't throw error in production - log and continue
      if (process.env.NODE_ENV === 'production') {
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      } else {
        throw error; // In development, throw to help debugging
      }
    }
  }

  // Optimize subject line to avoid common spam triggers
  optimizeSubjectLine(subject) {
    // Remove common spam trigger words and patterns
    const spamTriggers = [
      /FREE!/gi, /URGENT!/gi, /ACT NOW!/gi, /LIMITED TIME!/gi,
      /CLICK HERE!/gi, /BUY NOW!/gi, /OFFER EXPIRES!/gi,
      /\$\$\$/g, /!!!/g, /\?\?\?/g
    ];
    
    let optimized = subject;
    spamTriggers.forEach(trigger => {
      optimized = optimized.replace(trigger, (match) => {
        return match.toLowerCase().replace(/!/g, '');
      });
    });
    
    // Ensure subject line is not too long (recommended: under 50 characters)
    if (optimized.length > 50) {
      optimized = optimized.substring(0, 47) + '...';
    }
    
    return optimized;
  }

  // Add tracking pixel for engagement metrics (improves sender reputation)
  addTrackingPixel(htmlContent) {
    const trackingPixel = `
      <img src="${process.env.CLIENT_URL}/api/email/track.gif?t=${Date.now()}" 
           width="1" height="1" border="0" alt="" 
           style="display:block; width:1px; height:1px; border:0; outline:none;"
           aria-hidden="true">
    `;
    
    // Insert tracking pixel before closing body tag
    return htmlContent.replace('</body>', trackingPixel + '</body>');
  }

  // Convert HTML to plain text for better deliverability
  htmlToText(html) {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Helper method to get appropriate sender based on email type
  getSenderConfig(emailType) {
    const baseDomain = process.env.EMAIL_DOMAIN || 'in-nd-out.com';
    const emailUser = process.env.EMAIL_USER;
    
    // Ensure we always use the authenticated email address for 'from' field
    // to prevent sender address rejection errors
    // Handle EMAIL_FROM that might already include display name
    const fromAddress = process.env.EMAIL_FROM || emailUser;
    const authenticatedFrom = fromAddress.includes('<') ? fromAddress.match(/<(.+)>/)[1] : fromAddress;
    
    const senderConfigs = {
      // Personal emails from admin (professional but personal)
      'welcome': {
        from: `"Eugene at IN-N-OUT Store" <${authenticatedFrom}>`,
        replyTo: `eugene@${baseDomain}`,
        headers: {
          'X-Email-Category': 'welcome',
          'X-Sender-Type': 'personal'
        }
      },
      'contact_reply': {
        from: `"Eugene - Customer Support" <${authenticatedFrom}>`,
        replyTo: `support@${baseDomain}`,
        headers: {
          'X-Email-Category': 'customer-support',
          'X-Sender-Type': 'support'
        }
      },
      'admin_welcome': {
        from: `"IN-N-OUT Store - Admin Team" <${authenticatedFrom}>`,
        replyTo: `admin@${baseDomain}`,
        headers: {
          'X-Email-Category': 'admin-welcome',
          'X-Sender-Type': 'system'
        }
      },
      
      // Transactional emails (high deliverability priority)
      'order_confirmation': {
        from: `"IN-N-OUT Store Orders" <${authenticatedFrom}>`,
        replyTo: `orders@${baseDomain}`,
        headers: {
          'X-Email-Category': 'order-confirmation',
          'X-Sender-Type': 'transactional',
          'X-Priority': '1',
          'Importance': 'High'
        }
      },
      'order_status': {
        from: `"IN-N-OUT Store Shipping" <${authenticatedFrom}>`,
        replyTo: `shipping@${baseDomain}`,
        headers: {
          'X-Email-Category': 'order-status',
          'X-Sender-Type': 'transactional'
        }
      },
      'password_reset': {
        from: `"IN-N-OUT Store Security" <${authenticatedFrom}>`,
        replyTo: `security@${baseDomain}`,
        headers: {
          'X-Email-Category': 'password-reset',
          'X-Sender-Type': 'security',
          'X-Priority': '1',
          'Importance': 'High'
        }
      },
      
      // System notifications
      'low_stock': {
        from: `"IN-N-OUT Store Inventory" <${authenticatedFrom}>`,
        replyTo: `inventory@${baseDomain}`,
        headers: {
          'X-Email-Category': 'inventory-alert',
          'X-Sender-Type': 'system'
        }
      },
      'system_notification': {
        from: `"IN-N-OUT Store System" <${authenticatedFrom}>`,
        replyTo: `system@${baseDomain}`,
        headers: {
          'X-Email-Category': 'system-notification',
          'X-Sender-Type': 'system'
        }
      },
      
      // Default fallback with professional sender
      'default': {
        from: `"IN-N-OUT Store" <${authenticatedFrom}>`,
        replyTo: `hello@${baseDomain}`,
        headers: {
          'X-Email-Category': 'general',
          'X-Sender-Type': 'business'
        }
      }
    };

    return senderConfigs[emailType] || senderConfigs['default'];
  }

  // Modern, professional email template inspired by industry best practices
  getModernEmailTemplate({ title, headerColor = '#DC2626', content, compact = false }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  <style>
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .email-body { background: #1a1a1a !important; color: #ffffff !important; }
      .email-container { background: #2d2d2d !important; border: 1px solid #404040 !important; }
      .email-header { background: ${headerColor} !important; }
      .email-content { background: #2d2d2d !important; color: #ffffff !important; }
      .email-footer { background: #1a1a1a !important; color: #cccccc !important; }
      .text-muted { color: #cccccc !important; }
      .border-gray { border-color: #404040 !important; }
      .info-box { background: #333333 !important; border-color: #404040 !important; color: #ffffff !important; }
      .highlight-box { background: #2d2d2d !important; border-color: ${headerColor}50 !important; }
      .stat-item { background: #333333 !important; color: #ffffff !important; }
    }
    
    /* Light mode (default) */
    .email-body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333333;
      background: #f8f9fa;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      border: 1px solid #e9ecef;
    }
    
    /* Container */
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff; 
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    /* Header */
    .header { 
      background: ${headerColor}; 
      color: white; 
      padding: 32px 24px;
      text-align: center;
    }
    .header .logo {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 1px;
    }
    .header .title {
      font-size: 28px;
      font-weight: 600;
      margin: 0;
      line-height: 1.2;
    }
    .header .subtitle {
      font-size: 16px;
      opacity: 0.9;
      margin-top: 8px;
    }
    
    /* Content */
    .content { 
      padding: 32px 24px;
    }
    .content h2 {
      color: #1a1a1a;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    .content h3 {
      color: #333;
      font-size: 18px;
      font-weight: 600;
      margin: 24px 0 12px 0;
    }
    .content p {
      color: #555;
      font-size: 16px;
      margin-bottom: 16px;
      line-height: 1.6;
    }
    .content ul {
      margin: 16px 0;
      padding-left: 20px;
    }
    .content li {
      color: #555;
      margin-bottom: 8px;
    }
    
    /* Components */
    .button {
      display: inline-block;
      background: ${headerColor};
      color: white !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 8px 16px 0;
      transition: all 0.2s ease;
    }
    .button:hover {
      background: ${headerColor}dd;
      text-decoration: none;
      color: white !important;
    }
    .button.secondary {
      background: #6c757d;
      color: white !important;
    }
    
    .info-box {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid ${headerColor};
    }
    .info-box h3 {
      margin-top: 0;
      color: ${headerColor};
    }
    
    .highlight-box {
      background: ${headerColor}10;
      border: 1px solid ${headerColor}30;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    
    .stats-row {
      display: flex;
      gap: 16px;
      margin: 24px 0;
      flex-wrap: wrap;
    }
    .stat-item {
      background: #f8f9fa;
      border-radius: 6px;
      padding: 16px;
      text-align: center;
      flex: 1;
      min-width: 120px;
    }
    .stat-number {
      font-size: 24px;
      font-weight: 700;
      color: ${headerColor};
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
    }
    
    .divider {
      height: 1px;
      background: #e9ecef;
      margin: 32px 0;
    }
    
    /* Footer */
    .footer { 
      background: #f8f9fa; 
      padding: 24px; 
      text-align: center; 
      color: #666; 
      font-size: 14px;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      margin: 8px 0;
    }
    .footer a {
      color: #666;
      text-decoration: none;
      margin: 0 8px;
    }
    .footer a:hover {
      color: ${headerColor};
      text-decoration: underline;
    }
    
    /* Mobile responsive */
    @media only screen and (max-width: 600px) {
      body { padding: 10px; }
      .container { border-radius: 4px; }
      .header, .content { padding: 24px 16px; }
      .header .title { font-size: 24px; }
      .content h2 { font-size: 20px; }
      .button { 
        display: block; 
        margin: 12px 0; 
        text-align: center; 
      }
      .stats-row {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IN-N-OUT</div>
      <h1 class="title">${title}</h1>
      <p class="subtitle">Premium Shopping Experience</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><strong>IN-N-OUT Store</strong></p>
      <p>
        <a href="${process.env.CLIENT_URL}">Visit Store</a> •
        <a href="${process.env.CLIENT_URL}/support">Support</a> •
        <a href="${process.env.CLIENT_URL}/unsubscribe">Unsubscribe</a>
      </p>
      <p style="margin-top: 16px; font-size: 12px; color: #888;">
        © ${new Date().getFullYear()} IN-N-OUT Store. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  async sendPasswordResetEmail(email, resetUrl, userName = '') {
    const htmlContent = this.getModernEmailTemplate({
      title: 'Reset Your Password',
      content: `
        <h2>Password Reset Request</h2>
        <p>Hi ${userName ? userName : 'there'},</p>
        <p>You requested to reset your password for your IN-N-OUT Store account.</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        
        <div class="info-box">
          <p><strong>Security Notice:</strong> This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 24px;">
          If the button doesn't work, copy and paste this link: <br>
          <span style="font-family: monospace; background: #f5f5f5; padding: 4px; border-radius: 4px; word-break: break-all;">${resetUrl}</span>
        </p>
      `
    });

    return await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - IN-N-OUT Store',
      html: htmlContent,
      emailType: 'password_reset'
    });
  }

  async sendWelcomeEmail(email, userName, userRole = 'user') {
    const htmlContent = this.getModernEmailTemplate({
      title: `Welcome to IN-N-OUT Store`,
      content: `
        <h2>Welcome aboard, ${userName}!</h2>
        <p>Thank you for joining IN-N-OUT Store. We're excited to have you as part of our community.</p>
        
        <div class="highlight-box">
          <h3>What's Next?</h3>
          <p>Start exploring our premium collection and enjoy a seamless shopping experience.</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.CLIENT_URL}/shop" class="button">Start Shopping</a>
          <a href="${process.env.CLIENT_URL}/account" class="button secondary">Complete Profile</a>
        </div>
        
        <div class="info-box">
          <h3>Getting Started</h3>
          <ul>
            <li>Browse our latest products and deals</li>
            <li>Add items to your wishlist for later</li>
            <li>Set up your shipping preferences</li>
            <li>Subscribe to our newsletter for exclusive offers</li>
          </ul>
        </div>
        
        <p>If you have any questions, our support team is here to help.</p>
      `
    });

    return await this.sendEmail({
      to: email,
      subject: `Welcome to IN-N-OUT Store, ${userName}!`,
      html: htmlContent,
      emailType: 'welcome'
    });
  }

  async sendOrderConfirmationEmail(email, userName, orderDetails) {
    const htmlContent = this.getModernEmailTemplate({
      title: 'Order Confirmation',
      headerColor: '#28a745',
      icon: '🛍️',
      content: `
        <div class="order-header">
          <h2>Thank you for your order, ${userName}!</h2>
          <p>Your order has been confirmed and is being processed.</p>
        </div>
        
        <div class="order-details">
          <h3>📋 Order Summary</h3>
          <table class="order-table">
            <tr><td>Order ID</td><td>#${orderDetails.orderId}</td></tr>
            <tr><td>Order Date</td><td>${new Date(orderDetails.orderDate).toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</td></tr>
            <tr><td>Total Amount</td><td><strong>Gh₵${orderDetails.totalAmount}</strong></td></tr>
            <tr><td>Payment Method</td><td>${orderDetails.paymentMethod || 'Mobile Money Payment'}</td></tr>
            <tr><td>Order Status</td><td><span class="status-badge" style="background: #28a745;">CONFIRMED</span></td></tr>
          </table>
        </div>
        
        <div class="items-section">
          <h3>📦 Items Ordered</h3>
          ${orderDetails.items?.map(item => `
            <div class="item-row">
              <img src="${item.image}" alt="${item.title}" class="item-image">
              <div class="item-details">
                <h4>${item.title}</h4>
                <p>Quantity: ${item.quantity} × Gh₵${item.price}</p>
                <p class="item-total">Gh₵${(item.quantity * item.price).toFixed(2)}</p>
              </div>
            </div>
          `).join('') || '<p>Order items will be listed here.</p>'}
        </div>
        
        <div class="next-steps">
          <h3>📍 What's Next?</h3>
          <ul>
            <li>📦 We're preparing your order for shipment</li>
            <li>📧 You'll receive shipping confirmation with tracking details</li>
            <li>🚚 Estimated delivery: ${orderDetails.estimatedDelivery || '3-5 business days'}</li>
            <li>📱 Track your order status in real-time</li>
          </ul>
        </div>
        
        <div class="action-buttons" style="text-align: center;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/shop/account/orders/${orderDetails.orderId}" 
             class="button" 
             target="_blank" 
             rel="noopener noreferrer"
             style="display: inline-block; background: #28a745; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 8px;">
            Track Your Order
          </a>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/support" 
             class="button secondary" 
             target="_blank" 
             rel="noopener noreferrer"
             style="display: inline-block; background: #6c757d; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 8px;">
            Contact Support
          </a>
        </div>
      `
    });

    const senderConfig = this.getSenderConfig('order_confirmation');
    return await this.sendEmail({
      to: email,
      subject: `Order Confirmation #${orderDetails.orderId} - IN-N-OUT Store`,
      html: htmlContent,
      emailType: 'order_confirmation',
      ...senderConfig
    });
  }

  async sendOrderStatusUpdateEmail(email, userName, orderDetails, newStatus) {
    const statusConfig = {
      'confirmed': { color: '#28a745', icon: '✅', message: 'Your order has been confirmed!' },
      'processing': { color: '#ffc107', icon: '⚙️', message: 'Your order is being prepared!' },
      'shipped': { color: '#17a2b8', icon: '🚚', message: 'Your order is on its way!' },
      'delivered': { color: '#28a745', icon: '📦', message: 'Your order has been delivered!' },
      'cancelled': { color: '#dc3545', icon: '❌', message: 'Your order has been cancelled.' }
    };

    const config = statusConfig[newStatus] || statusConfig['processing'];

    const htmlContent = this.getModernEmailTemplate({
      title: 'Order Status Update',
      headerColor: config.color,
      icon: config.icon,
      content: `
        <div class="notification-header">
          <h2>${config.message}</h2>
          <p>Hello ${userName}, we have an update on your order!</p>
        </div>
        
        <div class="order-details">
          <table class="order-table">
            <tr><td>Order ID</td><td>#${orderDetails.orderId}</td></tr>
            <tr><td>Status</td><td><span class="status-badge" style="background: ${config.color}">${newStatus.toUpperCase()}</span></td></tr>
            <tr><td>Order Date</td><td>${new Date(orderDetails.orderDate).toLocaleDateString()}</td></tr>
            ${orderDetails.trackingNumber ? `<tr><td>Tracking Number</td><td>${orderDetails.trackingNumber}</td></tr>` : ''}
            ${orderDetails.estimatedDelivery ? `<tr><td>Est. Delivery</td><td>${orderDetails.estimatedDelivery}</td></tr>` : ''}
          </table>
        </div>
        
        ${newStatus === 'shipped' ? `
          <div class="next-steps">
            <h3>🚚 Your Package is On Its Way!</h3>
            <ul>
              <li>📍 Track your package using the tracking number above</li>
              <li>📱 You'll receive delivery notifications</li>
              <li>🏠 Estimated delivery: ${orderDetails.estimatedDelivery || '2-3 business days'}</li>
              <li>📞 Contact carrier directly for delivery updates</li>
            </ul>
          </div>
        ` : ''}
        
        ${newStatus === 'delivered' ? `
          <div class="message-box">
            <h3>⭐ How was your experience?</h3>
            <p>We'd love to hear about your shopping experience! Your feedback helps us serve you better.</p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.CLIENT_URL}/orders/${orderDetails.orderId}/review" class="button">Leave a Review</a>
            </div>
          </div>
        ` : ''}
        
        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL}/orders/${orderDetails.orderId}" class="button">View Order Details</a>
          ${newStatus !== 'delivered' && newStatus !== 'cancelled' ? 
            `<a href="${process.env.CLIENT_URL}/support" class="button secondary">Contact Support</a>` : ''}
        </div>
      `
    });

    const senderConfig = this.getSenderConfig('order_status');
    return await this.sendEmail({
      to: email,
      subject: `Order Update #${orderDetails.orderId} - ${config.message.replace('!', '')}`,
      html: htmlContent,
      ...senderConfig
    });
  }

  async sendProductSoldNotificationEmail(adminEmail, adminName, productDetails, orderDetails) {
    const htmlContent = this.getModernEmailTemplate({
      title: 'Product Sold! 🎉',
      headerColor: '#28a745',
      icon: '💰',
      content: `
        <div class="notification-header">
          <h2>🎉 Congratulations ${adminName}!</h2>
          <p>Your product just sold on IN-N-OUT Store!</p>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">Gh₵${(productDetails.salePrice * orderDetails.quantity).toFixed(2)}</div>
            <div class="stat-label">Sale Amount</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${orderDetails.quantity}</div>
            <div class="stat-label">Units Sold</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">Gh₵${(productDetails.salePrice * orderDetails.quantity * 0.8).toFixed(2)}</div>
            <div class="stat-label">Your Earnings</div>
          </div>
        </div>
        
        <div class="product-sold">
          <h3>📦 Product Details</h3>
          <div class="product-preview">
            <img src="${productDetails.image}" alt="${productDetails.title}" class="product-image">
            <div class="product-info">
              <h4>${productDetails.title}</h4>
              <p class="product-price">Sale Price: Gh₵${productDetails.salePrice}</p>
              <p>Category: ${productDetails.category}</p>
              <p>SKU: ${productDetails.sku || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div class="order-info">
          <h3>🛍️ Order Information</h3>
          <table class="order-table">
            <tr><td>Order ID</td><td>#${orderDetails.orderId}</td></tr>
            <tr><td>Customer</td><td>${orderDetails.customerName}</td></tr>
            <tr><td>Order Date</td><td>${new Date(orderDetails.orderDate).toLocaleDateString()}</td></tr>
            <tr><td>Status</td><td><span class="status-badge" style="background: #28a745;">${orderDetails.status.toUpperCase()}</span></td></tr>
          </table>
        </div>
        
        <div class="next-steps">
          <h3>📋 Next Steps</h3>
          <ul>
            <li>📦 Prepare the item for shipping (if you handle fulfillment)</li>
            <li>💳 Earnings will be processed within 3-5 business days</li>
            <li>📊 Check your dashboard for updated analytics</li>
            <li>📈 Consider restocking this popular item</li>
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL}/admin/orders/${orderDetails.orderId}" class="button">View Order Details</a>
          <a href="${process.env.CLIENT_URL}/admin/products/${productDetails.id}" class="button secondary">Manage Product</a>
        </div>
      `
    });

    return await this.sendEmail({
      to: adminEmail,
      subject: `🎉 Sale Alert: "${productDetails.title}" - Gh₵${(productDetails.salePrice * orderDetails.quantity).toFixed(2)}`,
      html: htmlContent
    });
  }

  async sendProductAddedNotificationEmail(superAdminEmail, adminDetails, productDetails) {
    const htmlContent = this.getModernEmailTemplate({
      title: 'New Product Added',
      headerColor: '#007bff',
      icon: '🆕',
      content: `
        <div class="notification-header">
          <h2>New Product Awaits Your Review</h2>
          <p>An admin has added a new product to the marketplace.</p>
        </div>
        
        <div class="admin-info">
          <h3>👤 Added by Admin</h3>
          <table class="order-table">
            <tr><td>Admin Name</td><td>${adminDetails.userName}</td></tr>
            <tr><td>Email</td><td>${adminDetails.email}</td></tr>
            <tr><td>Shop Name</td><td>${adminDetails.shopName || 'Not specified'}</td></tr>
            <tr><td>Registration Date</td><td>${new Date(adminDetails.createdAt).toLocaleDateString()}</td></tr>
          </table>
        </div>
        
        <div class="product-details">
          <h3>📦 Product Information</h3>
          <div class="product-preview">
            <img src="${productDetails.image}" alt="${productDetails.title}" class="product-image">
            <div class="product-info">
              <h4>${productDetails.title}</h4>
              <p class="product-price">Price: Gh₵${productDetails.price}</p>
              <p><strong>Category:</strong> ${productDetails.category}</p>
              <p><strong>Brand:</strong> ${productDetails.brand}</p>
              <p><strong>Stock:</strong> ${productDetails.totalStock} units</p>
            </div>
          </div>
          
          <div class="message-box">
            <h4>Product Description:</h4>
            <p>${productDetails.description?.substring(0, 300)}${productDetails.description?.length > 300 ? '...' : ''}</p>
          </div>
        </div>
        
        <div class="action-required">
          <h3>⚠️ Action Required</h3>
          <p>Please review this product for quality, compliance, and appropriateness before it goes live on the marketplace.</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL}/superadmin/products/${productDetails.id}" class="button">Review Product</a>
          <a href="${process.env.CLIENT_URL}/superadmin/products" class="button secondary">View All Pending</a>
        </div>
      `
    });

    return await this.sendEmail({
      to: superAdminEmail,
      subject: `🔍 Product Review Required: "${productDetails.title}"`,
      html: htmlContent
    });
  }

  async sendContactUsEmail(contactDetails) {
    // Email to admin/support team
    const adminHtmlContent = this.getModernEmailTemplate({
      title: 'New Contact Message',
      headerColor: '#6f42c1',
      icon: '📧',
      content: `
        <div class="contact-header">
          <h2>New Contact Form Submission</h2>
          <p>A customer has submitted a message through the contact form.</p>
        </div>
        
        <div class="contact-details">
          <h3>👤 Contact Information</h3>
          <table class="order-table">
            <tr><td>Name</td><td>${contactDetails.name}</td></tr>
            <tr><td>Email</td><td>${contactDetails.email}</td></tr>
            <tr><td>Phone</td><td>${contactDetails.phone || 'Not provided'}</td></tr>
            <tr><td>Subject</td><td>${contactDetails.subject}</td></tr>
            <tr><td>Submitted</td><td>${new Date().toLocaleString()}</td></tr>
            <tr><td>Priority</td><td><span class="status-badge" style="background: #ffc107;">NORMAL</span></td></tr>
          </table>
        </div>
        
        <div class="message-content">
          <h3>💬 Message</h3>
          <div class="message-box">
            <p>${contactDetails.message}</p>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="mailto:${contactDetails.email}?subject=Re: ${contactDetails.subject}" class="button">Reply via Email</a>
          <a href="${process.env.CLIENT_URL}/admin/support" class="button secondary">Support Dashboard</a>
        </div>
      `
    });

    // Email to customer (auto-reply)
    const customerHtmlContent = this.getModernEmailTemplate({
      title: 'Message Received',
      headerColor: '#28a745',
      icon: '💬',
      content: `
        <div class="contact-header">
          <h2>Thank you, ${contactDetails.name}!</h2>
          <p>We've received your message and will get back to you soon.</p>
        </div>
        
        <div class="message-summary">
          <h3>📋 Your Message Summary</h3>
          <table class="order-table">
            <tr><td>Subject</td><td>${contactDetails.subject}</td></tr>
            <tr><td>Submitted</td><td>${new Date().toLocaleString()}</td></tr>
            <tr><td>Reference ID</td><td>#${Date.now().toString().slice(-6)}</td></tr>
            <tr><td>Expected Response</td><td>Within 24 hours</td></tr>
          </table>
        </div>
        
        <div class="response-info">
          <h3>📞 What happens next?</h3>
          <ul>
            <li>📧 Our support team will review your message</li>
            <li>⏰ We typically respond within 24 hours</li>
            <li>🔔 You'll receive a response at this email address</li>
            <li>🎯 For urgent matters, call us directly</li>
          </ul>
        </div>
        
        <div class="message-box">
          <h3>📞 Need Immediate Help?</h3>
          <p><strong>Phone:</strong> +1 (555) 123-4567</p>
          <p><strong>Email:</strong> support@innoutstore.com</p>
          <p><strong>Live Chat:</strong> Available 9 AM - 6 PM EST</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL}/support" class="button">Visit Support Center</a>
          <a href="${process.env.CLIENT_URL}/support/faq" class="button secondary">View FAQ</a>
        </div>
      `
    });

    // Send to admin first
    await this.sendEmail({
      to: process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM,
      subject: `📧 Contact Form: ${contactDetails.subject}`,
      html: adminHtmlContent,
      from: `"IN-N-OUT Store System" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      replyTo: contactDetails.email // Allow direct reply to customer
    });

    // Send auto-reply to customer using proper sender configuration
    const customerSenderConfig = this.getSenderConfig('contact_reply');
    return await this.sendEmail({
      to: contactDetails.email,
      subject: '✅ Thank you for contacting IN-N-OUT Store',
      html: customerHtmlContent,
      ...customerSenderConfig
    });
  }

  // Additional email types for comprehensive functionality
  async sendLowStockAlert(adminEmail, adminName, productDetails) {
    const htmlContent = this.getModernEmailTemplate({
      title: 'Low Stock Alert',
      headerColor: '#ffc107',
      icon: '⚠️',
      content: `
        <div class="notification-header">
          <h2>⚠️ Low Stock Alert</h2>
          <p>Hello ${adminName}, one of your products is running low on inventory.</p>
        </div>
        
        <div class="product-details">
          <div class="product-preview">
            <img src="${productDetails.image}" alt="${productDetails.title}" class="product-image">
            <div class="product-info">
              <h4>${productDetails.title}</h4>
              <p class="product-price">Price: Gh₵${productDetails.price}</p>
              <p style="color: #dc3545; font-weight: 600; font-size: 18px;">⚠️ Only ${productDetails.totalStock} units left!</p>
              <p>Recommended minimum: 10 units</p>
            </div>
          </div>
        </div>
        
        <div class="action-required">
          <h3>🔄 Action Recommended</h3>
          <p>Consider restocking this item to avoid running out of inventory and missing potential sales.</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL}/admin/products/${productDetails.id}/edit" class="button">Update Stock</a>
          <a href="${process.env.CLIENT_URL}/admin/products" class="button secondary">View All Products</a>
        </div>
      `
    });

    return await this.sendEmail({
      to: adminEmail,
      subject: `⚠️ Low Stock: ${productDetails.title} (${productDetails.totalStock} units left)`,
      html: htmlContent
    });
  }

  // Abandoned cart emails
  async sendAbandonedCartEmail(email, userName, cartDetails, reminderStage = 1) {
    const stageConfig = {
      1: {
        delay: '1 hour',
        subject: 'You left something in your cart!',
        title: 'Don\'t forget your items',
        message: 'You have items waiting in your cart. Complete your purchase before they\'re gone!',
        urgency: 'low',
        discount: null
      },
      2: {
        delay: '24 hours',
        subject: 'Still thinking about your cart?',
        title: 'Your cart is waiting',
        message: 'Your selected items are still available. Complete your purchase now!',
        urgency: 'medium',
        discount: '5%'
      },
      3: {
        delay: '3 days',
        subject: 'Last chance - Cart expires soon!',
        title: 'Final reminder',
        message: 'This is your final reminder. Your cart will expire soon!',
        urgency: 'high',
        discount: '10%'
      }
    };

    const config = stageConfig[reminderStage] || stageConfig[1];
    const urgencyColors = {
      low: '#17a2b8',
      medium: '#ffc107',
      high: '#dc3545'
    };

    const htmlContent = this.getModernEmailTemplate({
      title: config.title,
      headerColor: urgencyColors[config.urgency],
      content: `
        <h2>🛒 ${config.title}</h2>
        <p>Hi ${userName},</p>
        <p>${config.message}</p>
        
        ${config.discount ? `
          <div class="highlight-box">
            <h3>🎉 Special Offer - ${config.discount} OFF!</h3>
            <p>Complete your purchase now and save ${config.discount} on your entire order!</p>
            <p><strong>Promo Code:</strong> <code>SAVE${config.discount.replace('%', '')}</code></p>
          </div>
        ` : ''}
        
        <div class="cart-summary">
          <h3>Your Cart Items</h3>
          <div class="cart-items">
            ${cartDetails.items.map(item => `
              <div class="cart-item">
                <img src="${item.image}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                <div class="item-details">
                  <h4>${item.title}</h4>
                  <p>Quantity: ${item.quantity}</p>
                  <p class="price">₵${item.price}</p>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="cart-total">
            <strong>Total: ₵${cartDetails.totalAmount}</strong>
          </div>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.CLIENT_URL}/shop/checkout" class="button">Complete Purchase</a>
          <a href="${process.env.CLIENT_URL}/shop/cart" class="button secondary">View Cart</a>
        </div>
        
        ${reminderStage === 3 ? `
          <div class="info-box">
            <p><strong>⏰ Cart Expiry Notice:</strong> Your cart will be cleared in 24 hours to make room for other customers.</p>
          </div>
        ` : ''}
        
        <div class="info-box">
          <h3>Why shop with us?</h3>
          <ul>
            <li>✅ Free shipping on orders over ₵100</li>
            <li>✅ 30-day return policy</li>
            <li>✅ Secure payment processing</li>
            <li>✅ Fast delivery nationwide</li>
          </ul>
        </div>
        
        <p style="font-size: 12px; color: #666; margin-top: 24px;">
          Don't want these reminders? <a href="${process.env.CLIENT_URL}/unsubscribe?email=${email}&type=cart" style="color: #666;">Unsubscribe from cart reminders</a>
        </p>
      `
    });

    return await this.sendEmail({
      to: email,
      subject: `🛒 ${config.subject} - IN-N-OUT Store`,
      html: htmlContent,
      emailType: 'abandoned_cart'
    });
  }

  // Cart recovery success email
  async sendCartRecoveryEmail(email, userName, orderDetails) {
    const htmlContent = this.getModernEmailTemplate({
      title: 'Thank you for your purchase!',
      headerColor: '#28a745',
      content: `
        <h2>🎉 Purchase Complete!</h2>
        <p>Hi ${userName},</p>
        <p>Great news! You've successfully completed your purchase. Thank you for choosing IN-N-OUT Store!</p>
        
        <div class="order-details">
          <h3>Order Summary</h3>
          <p><strong>Order ID:</strong> #${orderDetails.orderId}</p>
          <p><strong>Total:</strong> ₵${orderDetails.totalAmount}</p>
          <p><strong>Estimated Delivery:</strong> ${orderDetails.estimatedDelivery || '3-5 business days'}</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.CLIENT_URL}/account/orders/${orderDetails.orderId}" class="button">Track Order</a>
          <a href="${process.env.CLIENT_URL}/shop" class="button secondary">Continue Shopping</a>
        </div>
        
        <div class="highlight-box">
          <h3>What's Next?</h3>
          <ul>
            <li>📧 You'll receive a shipping confirmation when your order ships</li>
            <li>📱 Track your order anytime in your account</li>
            <li>💬 Contact support if you have any questions</li>
          </ul>
        </div>
      `
    });

    return await this.sendEmail({
      to: email,
      subject: '🎉 Order Confirmed - Thanks for completing your purchase!',
      html: htmlContent,
      emailType: 'order_confirmation'
    });
  }

  async sendNewAdminWelcomeEmail(email, adminName, temporaryPassword) {
    const htmlContent = this.getModernEmailTemplate({
      title: 'Welcome Admin!',
      headerColor: '#007bff',
      icon: '👋',
      content: `
        <div class="notification-header">
          <h2>Welcome to the team, ${adminName}!</h2>
          <p>Your admin account for IN-N-OUT Store has been created successfully.</p>
        </div>
        
        <div class="admin-credentials">
          <h3>🔐 Your Login Credentials</h3>
          <table class="order-table">
            <tr><td>Email</td><td>${email}</td></tr>
            <tr><td>Temporary Password</td><td style="font-family: monospace; background: #f8f9fa; padding: 8px; border-radius: 4px;">${temporaryPassword}</td></tr>
            <tr><td>Admin Panel</td><td><a href="${process.env.CLIENT_URL}/admin/login">Click to Login</a></td></tr>
          </table>
        </div>
        
        <div class="action-required">
          <h3>🔒 Security First!</h3>
          <p>For your security, please change your password immediately after your first login.</p>
        </div>
        
        <div class="next-steps">
          <h3>🚀 Getting Started Guide</h3>
          <ul>
            <li>🔐 Log in with your credentials above</li>
            <li>🔑 Change your temporary password</li>
            <li>📋 Complete your store profile</li>
            <li>📦 Add your first products</li>
            <li>📊 Explore the analytics dashboard</li>
            <li>💳 Set up payment preferences</li>
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL}/admin/login" class="button">Access Admin Panel</a>
          <a href="${process.env.CLIENT_URL}/admin/guide" class="button secondary">View Admin Guide</a>
        </div>
      `
    });

    return await this.sendEmail({
      to: email,
      subject: '🎉 Welcome to IN-N-OUT Store Admin Panel',
      html: htmlContent
    });
  }

  async sendMonthlyReportEmail(adminEmail, adminName, reportData) {
    const growthColor = reportData.growth >= 0 ? '#28a745' : '#dc3545';
    const growthIcon = reportData.growth >= 0 ? '📈' : '📉';

    const htmlContent = this.getModernEmailTemplate({
      title: 'Monthly Sales Report',
      headerColor: '#28a745',
      icon: '📊',
      content: `
        <div class="notification-header">
          <h2>📊 Monthly Report for ${adminName}</h2>
          <p>Your performance summary for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">Gh₵${reportData.totalSales || 0}</div>
            <div class="stat-label">Total Sales</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${reportData.totalOrders || 0}</div>
            <div class="stat-label">Orders</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">Gh₵${reportData.earnings || 0}</div>
            <div class="stat-label">Your Earnings</div>
          </div>
          <div class="stat-card" style="background: ${growthColor};">
            <div class="stat-number">${growthIcon} ${reportData.growth >= 0 ? '+' : ''}${reportData.growth || 0}%</div>
            <div class="stat-label">Growth</div>
          </div>
        </div>
        
        <div class="report-stats">
          <h3>📈 Detailed Performance</h3>
          <table class="order-table">
            <tr><td>Products Sold</td><td>${reportData.productsSold || 0} units</td></tr>
            <tr><td>Average Order Value</td><td>Gh₵${reportData.avgOrderValue || 0}</td></tr>
            <tr><td>Return Rate</td><td>${reportData.returnRate || 0}%</td></tr>
            <tr><td>Customer Satisfaction</td><td>${reportData.satisfaction || 0}% ⭐</td></tr>
          </table>
        </div>
        
        <div class="top-products">
          <h3>🏆 Top Performing Products</h3>
          ${reportData.topProducts?.map((product, index) => `
            <div class="item-row">
              <img src="${product.image}" alt="${product.title}" class="item-image">
              <div class="item-details">
                <h4>#${index + 1} ${product.title}</h4>
                <p>Units Sold: ${product.unitsSold} | Revenue: Gh₵${product.revenue}</p>
                <p class="item-total">⭐ ${product.rating || 'N/A'} rating</p>
              </div>
            </div>
          `).join('') || '<p>No sales data available for this period.</p>'}
        </div>
        
        <div class="next-steps">
          <h3>💡 Recommendations</h3>
          <ul>
            <li>📦 Restock your top-performing products</li>
            <li>🔍 Analyze low-performing items for improvements</li>
            <li>📣 Consider promotional campaigns for slow movers</li>
            <li>⭐ Follow up with customers for reviews</li>
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL}/admin/reports" class="button">View Detailed Report</a>
          <a href="${process.env.CLIENT_URL}/admin/products/add" class="button secondary">Add New Product</a>
        </div>
      `
    });

    return await this.sendEmail({
      to: adminEmail,
      subject: `📊 Your Monthly Report - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} | Gh₵${reportData.totalSales || 0} in sales`,
      html: htmlContent
    });
  }
  // Vendor payment notification email
  async sendVendorPaymentNotificationEmail(vendorEmail, vendorName, paymentDetails) {
    const htmlContent = this.getModernEmailTemplate({
      title: 'Payment Received',
      headerColor: '#28a745',
      icon: '💰',
      content: `
        <div class="notification-header">
          <h2>💰 Payment Received!</h2>
          <p>Hello ${vendorName}, you have received a payment from IN-N-OUT Store.</p>
        </div>
        
        <div class="payment-summary">
          <h3>💳 Payment Details</h3>
          <table class="order-table">
            <tr><td>Payment Amount</td><td><strong>Gh₵${paymentDetails.amount.toFixed(2)}</strong></td></tr>
            <tr><td>Payment Method</td><td>${paymentDetails.paymentMethod}</td></tr>
            <tr><td>Transaction ID</td><td>${paymentDetails.transactionId || 'N/A'}</td></tr>
            <tr><td>Payment Date</td><td>${new Date(paymentDetails.paymentDate).toLocaleDateString()}</td></tr>
            <tr><td>Period</td><td>${paymentDetails.period || 'N/A'}</td></tr>
            <tr><td>Status</td><td><span class="status-badge" style="background: #28a745;">COMPLETED</span></td></tr>
          </table>
        </div>
        
        ${paymentDetails.description ? `
          <div class="payment-notes">
            <h3>📝 Payment Notes</h3>
            <div class="message-box">
              <p>${paymentDetails.description}</p>
            </div>
          </div>
        ` : ''}
        
        <div class="account-summary">
          <h3>💼 Account Summary</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">Gh₵${(paymentDetails.currentBalance || 0).toFixed(2)}</div>
              <div class="stat-label">Current Balance</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">Gh₵${(paymentDetails.totalEarnings || 0).toFixed(2)}</div>
              <div class="stat-label">Total Earnings</div>
            </div>
          </div>
        </div>
        
        <div class="next-steps">
          <h3>📋 Important Information</h3>
          <ul>
            <li>💳 Payment has been processed successfully</li>
            <li>📧 Keep this email as a receipt for your records</li>
            <li>📊 Check your admin dashboard for updated balance</li>
            <li>💬 Contact support if you have any questions</li>
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL}/admin/payments" class="button">View Payment History</a>
          <a href="${process.env.CLIENT_URL}/admin/dashboard" class="button secondary">Go to Dashboard</a>
        </div>
      `
    });

    return await this.sendEmail({
      to: vendorEmail,
      subject: `💰 Payment Received - Gh₵${paymentDetails.amount.toFixed(2)} | IN-N-OUT Store`,
      html: htmlContent
    });
  }

  // Product review request email
  async sendProductReviewRequestEmail(customerEmail, customerName, orderDetails, productDetails) {
    const htmlContent = this.getModernEmailTemplate({
      title: 'Share Your Experience',
      headerColor: '#ffc107',
      icon: '⭐',
      content: `
        <div class="notification-header">
          <h2>⭐ How was your purchase?</h2>
          <p>Hi ${customerName}, we hope you're enjoying your recent purchase from IN-N-OUT Store!</p>
        </div>
        
        <div class="product-review">
          <h3>📦 Your Recent Purchase</h3>
          <div class="product-preview">
            <img src="${productDetails.image}" alt="${productDetails.title}" class="product-image">
            <div class="product-info">
              <h4>${productDetails.title}</h4>
              <p>Order #${orderDetails.orderId}</p>
              <p>Delivered on ${new Date(orderDetails.deliveryDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        <div class="review-request">
          <h3>💭 Share Your Thoughts</h3>
          <p>Your feedback helps other customers make informed decisions and helps us improve our service.</p>
          
          <div class="review-benefits">
            <h4>Why leave a review?</h4>
            <ul>
              <li>⭐ Help other customers choose the right products</li>
              <li>🏆 Earn loyalty points for detailed reviews</li>
              <li>📈 Help vendors improve their products</li>
              <li>🎁 Get early access to new products and deals</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL}/shop/products/${productDetails.id}/review?order=${orderDetails.orderId}" class="button">Write Review</a>
          <a href="${process.env.CLIENT_URL}/shop/account/orders" class="button secondary">View Orders</a>
        </div>
        
        <div class="message-box">
          <p><strong>Quick Review:</strong> Rate your experience in just 30 seconds, or write a detailed review to help others!</p>
        </div>
      `
    });

    return await this.sendEmail({
      to: customerEmail,
      subject: `⭐ How was "${productDetails.title}"? Share your experience!`,
      html: htmlContent
    });
  }

  // Newsletter subscription confirmation
  async sendNewsletterSubscriptionEmail(email, userName) {
    try {
      const html = this.getModernEmailTemplate({
        title: 'Newsletter Subscription',
        headerColor: '#10b981',
        icon: '📬',
        content: `
          <h2>Thank you for subscribing!</h2>
          <p>Hi ${userName || 'there'},</p>
          <p>You've successfully subscribed to the IN-N-OUT Store newsletter! 🎉</p>
          
          <div class="info-box">
            <h3>What to expect:</h3>
            <ul>
              <li>🏷️ Exclusive deals and early access to sales</li>
              <li>📦 New product announcements</li>
              <li>💡 Style tips and product recommendations</li>
              <li>🎁 Special birthday offers</li>
            </ul>
          </div>
          
          <p>We'll send you our newsletter weekly with the best deals and latest trends.</p>
          
          <div class="footer-note">
            <p>Don't want to receive these emails? You can <a href="${process.env.CLIENT_URL}/unsubscribe">unsubscribe at any time</a>.</p>
          </div>
        `
      });

      await this.sendEmail({
        to: email,
        subject: '📬 Welcome to IN-N-OUT Store Newsletter!',
        html,
        emailType: 'welcome',
        headers: {
          'X-Email-Category': 'newsletter-subscription',
          'X-Sender-Type': 'marketing'
        }
      });

      console.log(`Newsletter subscription confirmation sent to: ${email}`);
    } catch (error) {
      console.error('Error sending newsletter subscription email:', error);
      throw error;
    }
  }

  // NEW: Send message notification email
  async sendMessageNotificationEmail(recipientEmail, recipientName, senderName, senderRole, messageContent, conversationId) {
    try {
      const messageUrl = `${process.env.CLIENT_URL}/${senderRole === 'admin' ? 'super-admin' : 'admin'}/messaging`;
      const senderTitle = senderRole === 'admin' ? 'Admin' : 'Super Admin';
      const truncatedContent = messageContent.length > 100 ? messageContent.substring(0, 100) + '...' : messageContent;

      const htmlContent = this.getModernEmailTemplate({
        title: 'New Message',
        content: `
          <h2>You have a new message</h2>
          <p>Hi ${recipientName},</p>
          <p>You received a message from <strong>${senderName}</strong> (${senderTitle}).</p>
          
          <div class="info-box">
            <h3>Message Preview</h3>
            <p style="font-style: italic;">"${truncatedContent}"</p>
            <p style="font-size: 14px; color: #666; margin-top: 12px;">From: ${senderName}</p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${messageUrl}" class="button">View Message</a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            Please log into your dashboard to read the full message and reply.
          </p>
        `
      });

      return await this.sendEmail({
        to: recipientEmail,
        subject: `New message from ${senderName}`,
        html: htmlContent,
        emailType: 'system_notification'
      });
    } catch (error) {
      console.error('Error sending message notification email:', error);
      throw error;
    }
  }

  // Order delivery confirmation
  async sendOrderDeliveredEmail(customerEmail, customerName, orderDetails) {
    const htmlContent = this.getModernEmailTemplate({
      title: 'Order Delivered',
      headerColor: '#28a745',
      icon: '📦',
      content: `
        <div class="notification-header">
          <h2>📦 Order Delivered Successfully!</h2>
          <p>Great news ${customerName}! Your order has been delivered.</p>
        </div>
        
        <div class="order-summary">
          <h3>📋 Delivery Details</h3>
          <table class="order-table">
            <tr><td>Order ID</td><td>#${orderDetails.orderId}</td></tr>
            <tr><td>Delivered On</td><td>${new Date(orderDetails.deliveryDate).toLocaleDateString()}</td></tr>
            <tr><td>Delivery Time</td><td>${orderDetails.deliveryTime || 'N/A'}</td></tr>
            <tr><td>Total Amount</td><td><strong>Gh₵${orderDetails.totalAmount.toFixed(2)}</strong></td></tr>
          </table>
        </div>
        
        <div class="feedback-request">
          <h3>⭐ How was your experience?</h3>
          <p>We'd love to hear about your shopping experience. Your feedback helps us improve!</p>
          
          <div class="review-benefits">
            <h4>Leave a review and:</h4>
            <ul>
              <li>🏆 Help other customers make informed decisions</li>
              <li>🎁 Earn loyalty points for detailed reviews</li>
              <li>📈 Help us improve our service</li>
              <li>⭐ Share your experience with the community</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL}/shop/account/orders/${orderDetails.orderId}/review" class="button">Leave Review</a>
          <a href="${process.env.CLIENT_URL}/shop" class="button secondary">Continue Shopping</a>
        </div>
        
        <div class="message-box">
          <p><strong>Need Help?</strong> If you have any issues with your order, please contact our support team.</p>
        </div>
      `
    });

    return await this.sendEmail({
      to: customerEmail,
      subject: `📦 Order #${orderDetails.orderId} Delivered - We'd love your feedback!`,
      html: htmlContent
    });
  }

  // Security alert emails
  async sendSecurityAlertEmail(email, userName, alertDetails) {
    const alertTypes = {
      'suspicious_login': {
        color: '#dc3545',
        icon: '🚨',
        title: 'Suspicious Login Detected',
        message: 'We detected a login from an unrecognized device or location.'
      },
      'password_changed': {
        color: '#28a745',
        icon: '🔐',
        title: 'Password Changed Successfully',
        message: 'Your password has been successfully changed.'
      },
      'failed_login_attempts': {
        color: '#ffc107',
        icon: '⚠️',
        title: 'Multiple Failed Login Attempts',
        message: 'Multiple failed login attempts detected on your account.'
      },
      'account_locked': {
        color: '#dc3545',
        icon: '🔒',
        title: 'Account Temporarily Locked',
        message: 'Your account has been temporarily locked due to security reasons.'
      },
      'new_device_login': {
        color: '#17a2b8',
        icon: '📱',
        title: 'New Device Login',
        message: 'Your account was accessed from a new device.'
      }
    };

    const config = alertTypes[alertDetails.type] || alertTypes['suspicious_login'];

    const htmlContent = this.getModernEmailTemplate({
      title: config.title,
      headerColor: config.color,
      content: `
        <h2>${config.icon} ${config.title}</h2>
        <p>Hi ${userName},</p>
        <p>${config.message}</p>
        
        <div class="info-box">
          <h3>Security Details</h3>
          <p><strong>Time:</strong> ${new Date(alertDetails.timestamp).toLocaleString()}</p>
          <p><strong>IP Address:</strong> ${alertDetails.ipAddress || 'Unknown'}</p>
          <p><strong>Location:</strong> ${alertDetails.location || 'Unknown'}</p>
          <p><strong>Device:</strong> ${alertDetails.userAgent || 'Unknown'}</p>
        </div>
        
        ${alertDetails.type === 'suspicious_login' || alertDetails.type === 'new_device_login' ? `
          <div class="highlight-box">
            <h3>Was this you?</h3>
            <p>If you recognize this activity, you can ignore this email. If not, please take immediate action.</p>
          </div>
        ` : ''}
        
        ${alertDetails.type === 'failed_login_attempts' || alertDetails.type === 'account_locked' ? `
          <div class="highlight-box">
            <h3>Account Protection</h3>
            <p>If you're having trouble signing in, please reset your password or contact support.</p>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 32px 0;">
          ${alertDetails.type !== 'password_changed' ? `
            <a href="${process.env.CLIENT_URL}/auth/forgot-password" class="button">Reset Password</a>
          ` : ''}
          <a href="${process.env.CLIENT_URL}/support" class="button secondary">Contact Support</a>
        </div>
        
        <div class="info-box">
          <h3>Security Best Practices</h3>
          <ul>
            <li>Use a strong, unique password</li>
            <li>Enable two-factor authentication when available</li>
            <li>Don't share your login credentials</li>
            <li>Log out from shared devices</li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 24px;">
          If you didn't initiate this action, please contact our support team immediately.
        </p>
      `
    });

    return await this.sendEmail({
      to: email,
      subject: `🔒 Security Alert: ${config.title} - IN-N-OUT Store`,
      html: htmlContent,
      emailType: 'security_alert'
    });
  }

  // Account lockout notification
  async sendAccountLockoutEmail(email, userName, lockoutDetails) {
    const htmlContent = this.getModernEmailTemplate({
      title: 'Account Temporarily Locked',
      headerColor: '#dc3545',
      content: `
        <h2>🔒 Account Security Alert</h2>
        <p>Hi ${userName},</p>
        <p>Your account has been temporarily locked due to multiple failed login attempts.</p>
        
        <div class="info-box">
          <h3>Lockout Details</h3>
          <p><strong>Locked at:</strong> ${new Date(lockoutDetails.lockTime).toLocaleString()}</p>
          <p><strong>Failed attempts:</strong> ${lockoutDetails.attempts || 'Multiple'}</p>
          <p><strong>Unlock time:</strong> ${lockoutDetails.unlockTime ? new Date(lockoutDetails.unlockTime).toLocaleString() : '15 minutes from lock time'}</p>
          <p><strong>IP Address:</strong> ${lockoutDetails.ipAddress || 'Unknown'}</p>
        </div>
        
        <div class="highlight-box">
          <h3>What to do next:</h3>
          <ul>
            <li>Wait for the lockout period to expire (15 minutes)</li>
            <li>Reset your password if you've forgotten it</li>
            <li>Contact support if you didn't initiate these login attempts</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.CLIENT_URL}/auth/forgot-password" class="button">Reset Password</a>
          <a href="${process.env.CLIENT_URL}/support" class="button secondary">Contact Support</a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 24px;">
          Your account security is important to us. If you suspect unauthorized access, please change your password immediately.
        </p>
      `
    });

    return await this.sendEmail({
      to: email,
      subject: '🔒 Account Locked - Security Protection - IN-N-OUT Store',
      html: htmlContent,
      emailType: 'security_alert'
    });
  }

  // Weekly/Monthly report emails
  async sendWeeklyReportEmail(email, userName, reportData) {
    const htmlContent = this.getModernEmailTemplate({
      title: 'Weekly Performance Report',
      headerColor: '#28a745',
      content: `
        <h2>📊 Weekly Report</h2>
        <p>Hi ${userName},</p>
        <p>Here's your performance summary for the week of ${reportData.weekStart} to ${reportData.weekEnd}.</p>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${reportData.totalOrders || 0}</div>
            <div class="stat-label">Orders</div>
            <div class="stat-change ${reportData.ordersChange >= 0 ? 'positive' : 'negative'}">
              ${reportData.ordersChange >= 0 ? '+' : ''}${reportData.ordersChange || 0}%
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-number">₵${reportData.totalRevenue || 0}</div>
            <div class="stat-label">Revenue</div>
            <div class="stat-change ${reportData.revenueChange >= 0 ? 'positive' : 'negative'}">
              ${reportData.revenueChange >= 0 ? '+' : ''}${reportData.revenueChange || 0}%
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${reportData.newCustomers || 0}</div>
            <div class="stat-label">New Customers</div>
            <div class="stat-change ${reportData.customersChange >= 0 ? 'positive' : 'negative'}">
              ${reportData.customersChange >= 0 ? '+' : ''}${reportData.customersChange || 0}%
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${reportData.productsSold || 0}</div>
            <div class="stat-label">Products Sold</div>
            <div class="stat-change ${reportData.productsSoldChange >= 0 ? 'positive' : 'negative'}">
              ${reportData.productsSoldChange >= 0 ? '+' : ''}${reportData.productsSoldChange || 0}%
            </div>
          </div>
        </div>
        
        ${reportData.topProducts && reportData.topProducts.length > 0 ? `
          <div class="highlight-box">
            <h3>🏆 Top Performing Products</h3>
            <div class="top-products">
              ${reportData.topProducts.slice(0, 5).map((product, index) => `
                <div class="product-item">
                  <span class="rank">#${index + 1}</span>
                  <img src="${product.image}" alt="${product.title}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;">
                  <div class="product-details">
                    <h4>${product.title}</h4>
                    <p>${product.soldCount} sold • ₵${product.revenue}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${reportData.insights && reportData.insights.length > 0 ? `
          <div class="info-box">
            <h3>💡 Key Insights</h3>
            <ul>
              ${reportData.insights.map(insight => `<li>${insight}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.CLIENT_URL}/${reportData.userRole === 'admin' ? 'admin' : 'super-admin'}/dashboard" class="button">View Full Dashboard</a>
          <a href="${process.env.CLIENT_URL}/${reportData.userRole === 'admin' ? 'admin' : 'super-admin'}/reports" class="button secondary">Detailed Reports</a>
        </div>
        
        <div class="info-box">
          <h3>📈 Recommendations</h3>
          <ul>
            <li>Focus on promoting your top-performing products</li>
            <li>Consider restocking items that are selling well</li>
            <li>Analyze customer feedback for improvement opportunities</li>
            <li>Monitor seasonal trends for better inventory planning</li>
          </ul>
        </div>
      `
    });

    return await this.sendEmail({
      to: email,
      subject: `📊 Weekly Report: ${reportData.totalOrders} orders, ₵${reportData.totalRevenue} revenue`,
      html: htmlContent,
      emailType: 'weekly_report'
    });
  }

  async sendMonthlyReportEmail(email, userName, reportData) {
    const htmlContent = this.getModernEmailTemplate({
      title: 'Monthly Performance Report',
      headerColor: '#17a2b8',
      content: `
        <h2>📊 Monthly Report - ${reportData.monthName} ${reportData.year}</h2>
        <p>Hi ${userName},</p>
        <p>Here's your comprehensive performance summary for ${reportData.monthName} ${reportData.year}.</p>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${reportData.totalOrders || 0}</div>
            <div class="stat-label">Total Orders</div>
            <div class="stat-change ${reportData.ordersChange >= 0 ? 'positive' : 'negative'}">
              ${reportData.ordersChange >= 0 ? '+' : ''}${reportData.ordersChange || 0}% vs last month
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-number">₵${reportData.totalRevenue || 0}</div>
            <div class="stat-label">Total Revenue</div>
            <div class="stat-change ${reportData.revenueChange >= 0 ? 'positive' : 'negative'}">
              ${reportData.revenueChange >= 0 ? '+' : ''}${reportData.revenueChange || 0}% vs last month
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-number">₵${reportData.avgOrderValue || 0}</div>
            <div class="stat-label">Avg Order Value</div>
            <div class="stat-change ${reportData.aovChange >= 0 ? 'positive' : 'negative'}">
              ${reportData.aovChange >= 0 ? '+' : ''}${reportData.aovChange || 0}%
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${reportData.newCustomers || 0}</div>
            <div class="stat-label">New Customers</div>
            <div class="stat-change ${reportData.customersChange >= 0 ? 'positive' : 'negative'}">
              ${reportData.customersChange >= 0 ? '+' : ''}${reportData.customersChange || 0}%
            </div>
          </div>
        </div>
        
        <div class="highlight-box">
          <h3>🏆 Month Highlights</h3>
          <div class="achievements">
            ${reportData.highlights && reportData.highlights.map(highlight => `
              <div class="achievement">
                <span class="achievement-icon">${highlight.icon}</span>
                <div class="achievement-text">
                  <h4>${highlight.title}</h4>
                  <p>${highlight.description}</p>
                </div>
              </div>
            `).join('') || '<p>Great month! Keep up the excellent work.</p>'}
          </div>
        </div>
        
        ${reportData.categoryBreakdown && reportData.categoryBreakdown.length > 0 ? `
          <div class="info-box">
            <h3>📈 Sales by Category</h3>
            <div class="category-breakdown">
              ${reportData.categoryBreakdown.map(category => `
                <div class="category-item">
                  <span class="category-name">${category.name}</span>
                  <span class="category-sales">₵${category.sales}</span>
                  <span class="category-percentage">${category.percentage}%</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.CLIENT_URL}/${reportData.userRole === 'admin' ? 'admin' : 'super-admin'}/analytics" class="button">View Analytics</a>
          <a href="${process.env.CLIENT_URL}/${reportData.userRole === 'admin' ? 'admin' : 'super-admin'}/export-report?month=${reportData.monthNumber}&year=${reportData.year}" class="button secondary">Export Report</a>
        </div>
        
        <div class="info-box">
          <h3>🚀 Growth Opportunities</h3>
          <ul>
            <li>Consider expanding inventory in your best-performing categories</li>
            <li>Implement loyalty programs to retain existing customers</li>
            <li>Analyze seasonal patterns for better planning</li>
            <li>Focus marketing efforts on high-value customer segments</li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 24px;">
          Want to customize these reports? <a href="${process.env.CLIENT_URL}/settings/notifications">Update your preferences</a>
        </p>
      `
    });

    return await this.sendEmail({
      to: email,
      subject: `📊 ${reportData.monthName} Report: ₵${reportData.totalRevenue} revenue, ${reportData.totalOrders} orders`,
      html: htmlContent,
      emailType: 'monthly_report'
    });
  }
}

// Create and export a singleton instance
const emailService = new EmailService();

module.exports = emailService; 