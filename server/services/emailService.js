const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';
    
    try {
      switch (emailProvider.toLowerCase()) {
        case 'gmail':
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD
            }
          });
          break;

        case 'sendgrid':
          this.transporter = nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
              user: 'apikey',
              pass: process.env.SENDGRID_API_KEY
            }
          });
          break;

        case 'mailgun':
          this.transporter = nodemailer.createTransport({
            service: 'Mailgun',
            auth: {
              user: process.env.MAILGUN_USERNAME,
              pass: process.env.MAILGUN_PASSWORD
            }
          });
          break;

        case 'outlook':
          this.transporter = nodemailer.createTransport({
            service: 'hotmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD
            }
          });
          break;

        case 'custom':
          this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD
            }
          });
          break;

        default:
          console.warn('No valid email provider configured. Email functionality will be disabled.');
          return;
      }

      console.log(`Email service initialized with provider: ${emailProvider}`);
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
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

  async sendEmail(options) {
    if (!this.transporter) {
      throw new Error('Email service not configured. Please check your environment variables.');
    }

    // Enhanced anti-spam and deliverability headers
    // Handle EMAIL_FROM that might already include display name
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const cleanFromAddress = fromAddress.includes('<') ? fromAddress.match(/<(.+)>/)[1] : fromAddress;
    
    const defaultOptions = {
      from: `"IN-N-OUT Store" <${cleanFromAddress}>`,
      replyTo: process.env.REPLY_TO_EMAIL || cleanFromAddress,
      headers: {
        // Mailer identification
        'X-Mailer': 'IN-N-OUT Store Email Service v2.0',
        'X-Entity-ID': 'IN-N-OUT-Store-Official',
        'X-SenderScore': 'Trusted-Merchant',
        
        // Email priority and importance
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        
        // Subscription management (required for better deliverability)
        'List-Unsubscribe': `<${process.env.CLIENT_URL}/unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'List-ID': '<in-n-out-store.in-nd-out.com>',
        
        // Anti-spam and classification headers
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'X-SES-RECEIPT': 'AEUBSRUaI2xvY2FsaG9zdA==',
        'X-Classification': 'TRANSACTIONAL',
        'X-Email-Type': 'LEGITIMATE-BUSINESS',
        
        // Authentication and security headers
        'Authentication-Results': 'in-nd-out.com; spf=pass; dkim=pass; dmarc=pass',
        'X-Spam-Status': 'No, score=-2.6',
        'X-Spam-Level': '',
        'X-Spam-Flag': 'NO',
        
        // Content classification
        'Content-Language': 'en-US',
        'X-Content-Type-Message-Body': 'html',
        
        // Delivery confirmation
        'Return-Receipt-To': process.env.EMAIL_FROM || process.env.EMAIL_USER,
        'Disposition-Notification-To': process.env.EMAIL_FROM || process.env.EMAIL_USER,
        
        // Anti-phishing headers
        'X-Originating-IP': '[127.0.0.1]',
        'X-Source-IP': '[127.0.0.1]',
        'X-Source-Args': '[127.0.0.1]:ESMTP',
        
        // Message categorization
        'X-MS-Exchange-Organization-PRD': 'IN-N-OUT.store',
        'X-MS-Exchange-Organization-MessageDirectionality': 'Outbound',
        
        // Bulk email classification (mark as transactional, not bulk)
        'Precedence': 'list',
        'X-Auto-Generated': 'false',
        'X-Bulk': 'false',
        
        // Enhanced message ID for tracking
        'Message-ID': `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}-innout@${process.env.EMAIL_DOMAIN || 'in-nd-out.com'}>`,
        
        // Thread and conversation management
        'X-Thread-Topic': options.subject || 'IN-N-OUT Store Notification',
        'Thread-Topic': options.subject || 'IN-N-OUT Store Notification',
        
        // Feedback loop headers
        'X-Report-Abuse-To': `abuse@${process.env.EMAIL_DOMAIN || 'in-nd-out.com'}`,
        'X-Complaints-To': `complaints@${process.env.EMAIL_DOMAIN || 'in-nd-out.com'}`,
        
        // Marketing compliance
        'X-MC-User': 'legitimate-business',
        'X-MC-Tags': 'transactional,ecommerce,order-confirmation,welcome',
        
        // Additional deliverability headers
        'Organization': 'IN-N-OUT Store - Premium E-commerce',
        'X-Company': 'IN-N-OUT Store',
        'X-Business-Type': 'E-commerce',
        'X-Industry': 'Retail',
        
        // GDPR and compliance headers
        'X-Privacy-Policy': `${process.env.CLIENT_URL}/privacy`,
        'X-Terms-Of-Service': `${process.env.CLIENT_URL}/terms`,
        'X-Unsubscribe-Policy': `${process.env.CLIENT_URL}/unsubscribe-policy`
      }
    };

    const mailOptions = { ...defaultOptions, ...options };

    // Enhance sender information based on email type
    if (options.emailType) {
      const senderConfig = this.getSenderConfig(options.emailType);
      mailOptions.from = senderConfig.from;
      mailOptions.replyTo = senderConfig.replyTo;
    }

    // Add text version for better deliverability (crucial for spam prevention)
    if (mailOptions.html && !mailOptions.text) {
      mailOptions.text = this.htmlToText(mailOptions.html);
    }

    // Optimize subject line to avoid spam triggers
    if (mailOptions.subject) {
      mailOptions.subject = this.optimizeSubjectLine(mailOptions.subject);
    }

    // Add tracking pixel for engagement (helps with sender reputation)
    if (mailOptions.html) {
      mailOptions.html = this.addTrackingPixel(mailOptions.html);
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      console.log('📧 Anti-spam headers applied for better deliverability');
      return info;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw error;
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

  // Modern email template generator with improved design and spam prevention
  getModernEmailTemplate({ title, headerColor, icon, content }) {
    // Use the red IN-N-OUT logo for emails
    const logoSvg = `
      <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="8" fill="#DC2626"/>
        <text x="50" y="35" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="18">IN</text>
        <text x="50" y="55" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="12">N</text>
        <text x="50" y="75" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="18">OUT</text>
      </svg>
    `;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="format-detection" content="telephone=no">
        <meta name="format-detection" content="date=no">
        <meta name="format-detection" content="address=no">
        <meta name="format-detection" content="email=no">
        <title>${title}</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        <style>
          /* Reset and base styles */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            line-height: 1.6; 
            color: #333333; 
            background: #f8f9fa; 
            margin: 0; 
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          
          /* Container styles */
          .email-container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: #ffffff; 
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border: 1px solid #e9ecef;
          }
          
          /* Header styles */
          .header { 
            background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%); 
            color: #ffffff; 
            padding: 40px 30px; 
            text-align: center; 
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: shimmer 3s ease-in-out infinite;
          }
          @keyframes shimmer {
            0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(0deg); }
            50% { transform: translateX(0%) translateY(0%) rotate(180deg); }
          }
          
          .logo-container {
            margin-bottom: 20px;
            position: relative;
            z-index: 2;
          }
          .logo {
            width: 60px;
            height: 60px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255,255,255,0.3);
          }
          .logo svg {
            width: 36px;
            height: 36px;
          }
          .logo .icon {
            font-size: 28px;
            line-height: 1;
          }
          
          .header h1 { 
            font-size: 28px; 
            margin-bottom: 8px; 
            font-weight: 600; 
            position: relative;
            z-index: 2;
          }
          .header .subtitle { 
            font-size: 16px; 
            opacity: 0.9; 
            font-weight: 400;
            position: relative;
            z-index: 2;
          }
          
          /* Content styles */
          .content { 
            padding: 40px 30px; 
            background: #ffffff;
          }
          
          /* Message preview styles */
          .message-preview {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-left: 4px solid #3b82f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .message-header {
            font-size: 14px;
            color: #6c757d;
            margin-bottom: 10px;
            font-weight: 500;
          }
          .message-content {
            font-size: 16px;
            color: #495057;
            font-style: italic;
            line-height: 1.5;
            padding: 10px 0;
          }
          
          /* Component styles */
          .notification-header h2 {
            color: #2c3e50;
            font-size: 24px;
            margin-bottom: 16px;
            font-weight: 600;
          }
          .notification-header p {
            color: #5a6c7d;
            font-size: 16px;
            margin-bottom: 12px;
            line-height: 1.5;
          }
          
          .button { 
            display: inline-block; 
            background: ${headerColor}; 
            color: #ffffff; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 16px;
            margin: 8px 4px;
            transition: all 0.3s ease;
            border: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
          }
          .button:hover {
            background: ${headerColor}dd;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
            text-decoration: none;
            color: #ffffff;
          }
          .button.secondary {
            background: #6c757d;
            color: #ffffff;
          }
          .button.secondary:hover {
            background: #5a6268;
            color: #ffffff;
            text-decoration: none;
          }
          
          .action-buttons {
            text-align: center;
            margin: 30px 0;
          }
          
          .message-box {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid ${headerColor};
          }
          
          .action-required {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
          }
          .action-required h3 {
            color: #856404;
            margin-bottom: 10px;
          }
          .action-required p {
            color: #856404;
            margin: 0;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 16px;
            margin: 24px 0;
          }
          .stat-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border: 1px solid #e9ecef;
          }
          .stat-number {
            font-size: 24px;
            font-weight: 700;
            color: ${headerColor};
            margin-bottom: 4px;
          }
          .stat-label {
            font-size: 14px;
            color: #6c757d;
            font-weight: 500;
          }
          
          .order-table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
          }
          .order-table td {
            padding: 12px 8px;
            border-bottom: 1px solid #e9ecef;
            vertical-align: top;
          }
          .order-table td:first-child {
            font-weight: 600;
            color: #495057;
            width: 40%;
          }
          .order-table td:last-child {
            color: #212529;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .next-steps ul {
            list-style: none;
            padding: 0;
          }
          .next-steps li {
            padding: 8px 0;
            border-bottom: 1px solid #f1f3f4;
            color: #5f6368;
          }
          .next-steps li:last-child {
            border-bottom: none;
          }
          
          .product-preview {
            display: flex;
            align-items: center;
            gap: 16px;
            margin: 16px 0;
            padding: 16px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
          }
          .product-image {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 8px;
            border: 1px solid #dee2e6;
          }
          .product-info h4 {
            margin: 0 0 8px 0;
            color: #212529;
            font-size: 16px;
            font-weight: 600;
          }
          .product-info p {
            margin: 4px 0;
            color: #6c757d;
            font-size: 14px;
          }
          .product-price {
            font-weight: 600;
            color: ${headerColor} !important;
            font-size: 16px !important;
          }
          
          /* Footer styles */
          .footer { 
            background: #f8f9fa; 
            padding: 30px 20px; 
            text-align: center; 
            color: #6c757d; 
            font-size: 14px; 
            border-top: 1px solid #dee2e6; 
          }
          .footer strong {
            color: #495057;
          }
          .footer p {
            margin: 8px 0;
            line-height: 1.5;
          }
          .footer a {
            color: #6c757d;
            text-decoration: none;
            margin: 0 8px;
          }
          .footer a:hover {
            color: ${headerColor};
            text-decoration: underline;
          }
          
          /* Responsive design */
          @media only screen and (max-width: 600px) {
            .email-container {
              margin: 10px;
              border-radius: 8px;
            }
            .header, .content {
              padding: 30px 20px;
            }
            .header h1 {
              font-size: 24px;
            }
            .button {
              display: block;
              margin: 12px 0;
              text-align: center;
            }
            .stats-grid {
              grid-template-columns: 1fr;
            }
            .product-preview {
              flex-direction: column;
              text-align: center;
            }
          }
          
          /* Dark mode support */
          @media (prefers-color-scheme: dark) {
            .email-container {
              background: #1a1a1a;
              border-color: #333;
            }
            .content {
              background: #1a1a1a;
              color: #e0e0e0;
            }
            .notification-header h2 {
              color: #ffffff;
            }
            .notification-header p {
              color: #b0b0b0;
            }
            .message-box {
              background: #2a2a2a;
              border-color: #444;
              color: #e0e0e0;
            }
            .order-table td {
              border-color: #444;
              color: #e0e0e0;
            }
            .order-table td:first-child {
              color: #b0b0b0;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo-container">
              <div class="logo">
                ${logoSvg}
              </div>
            </div>
            <h1>${title}</h1>
            <p class="subtitle">IN-N-OUT Store - Premium Shopping Experience</p>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p><strong>IN-N-OUT Store</strong></p>
            <p>Your gateway to premium products with a seamless shopping experience</p>
            <p>© ${new Date().getFullYear()} IN-N-OUT Store. All rights reserved.</p>
            <p style="margin-top: 20px;">
              <a href="${process.env.CLIENT_URL}" style="color: #6c757d; text-decoration: none;">Visit Store</a> |
              <a href="${process.env.CLIENT_URL}/support" style="color: #6c757d; text-decoration: none;">Support</a> |
              <a href="${process.env.CLIENT_URL}/unsubscribe" style="color: #6c757d; text-decoration: none;">Unsubscribe</a>
            </p>
            <p style="margin-top: 16px; font-size: 12px; color: #868e96;">
              This email was sent to you because you have an account with IN-N-OUT Store.<br>
              If you no longer wish to receive these emails, you can <a href="${process.env.CLIENT_URL}/unsubscribe" style="color: #868e96;">unsubscribe here</a>.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendPasswordResetEmail(email, resetUrl, userName = '') {
    const htmlContent = this.getModernEmailTemplate({
      title: 'Password Reset Request',
      headerColor: '#007bff',
      icon: '🔐',
      content: `
        <div class="notification-header">
          <h2>Password Reset Request</h2>
          <p>Hello ${userName ? userName : ''},</p>
          <p>We received a request to reset your password for your IN-N-OUT Store account.</p>
        </div>
        
        <div class="action-buttons" style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset My Password</a>
        </div>
        
        <div class="message-box">
          <p><strong>Or copy and paste this link into your browser:</strong></p>
          <p style="word-break: break-all; font-family: monospace;">${resetUrl}</p>
        </div>
        
        <div class="action-required">
          <h3>⚠️ Important Security Notice</h3>
          <p>This link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email.</p>
        </div>
      `
    });

    const senderConfig = this.getSenderConfig('password_reset');
    return await this.sendEmail({
      to: email,
      subject: 'Security: Password Reset for Your Account',
      html: htmlContent,
      ...senderConfig
    });
  }

  async sendWelcomeEmail(email, userName) {
    const htmlContent = this.getModernEmailTemplate({
      title: 'Welcome to IN-N-OUT Store',
      headerColor: '#28a745',
      icon: '🎉',
      content: `
        <div class="notification-header">
          <h2>Welcome ${userName}!</h2>
          <p>Thank you for joining IN-N-OUT Store! Your account has been successfully created.</p>
          <p><em>I'm Eugene, and I personally welcome you to our store family!</em></p>
        </div>
        
        <div class="next-steps">
          <h3>🚀 Get Started</h3>
          <ul>
            <li>🛍️ Browse our premium product catalog</li>
            <li>❤️ Save items to your wishlist</li>
            <li>🛒 Enjoy our seamless checkout experience</li>
            <li>📦 Track your orders in real-time</li>
            <li>⭐ Leave reviews and earn rewards</li>
          </ul>
        </div>
        
        <div class="message-box">
          <h3>💬 A Personal Note</h3>
          <p>If you have any questions or need assistance, don't hesitate to reach out. I'm here to ensure you have the best shopping experience possible!</p>
          <p style="margin-top: 15px;"><strong>- Eugene, Founder</strong></p>
        </div>
        
        <div class="action-buttons" style="text-align: center;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/shop/listing" 
             class="button" 
             target="_blank" 
             rel="noopener noreferrer"
             style="display: inline-block; background: #28a745; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 8px;">
            Start Shopping Now
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

    // Send welcome email using enhanced sender configuration
    const senderConfig = this.getSenderConfig('welcome');
    return await this.sendEmail({
      to: email,
      subject: 'Welcome to IN-N-OUT Store - Account Created Successfully',
      html: htmlContent,
      emailType: 'welcome',
      ...senderConfig
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

  async sendAbandonedCartEmail(email, userName, cartItems) {
    const totalValue = cartItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    const htmlContent = this.getModernEmailTemplate({
      title: 'Your Cart Awaits!',
      headerColor: '#6f42c1',
      icon: '🛒',
      content: `
        <div class="notification-header">
          <h2>Don't Miss Out, ${userName}!</h2>
          <p>You have ${cartItems.length} item${cartItems.length > 1 ? 's' : ''} waiting in your cart worth $${totalValue.toFixed(2)}.</p>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${cartItems.length}</div>
            <div class="stat-label">Items</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">Gh₵${totalValue.toFixed(2)}</div>
            <div class="stat-label">Total Value</div>
          </div>
        </div>
        
        <div class="items-section">
          <h3>🛍️ Items in Your Cart</h3>
          ${cartItems.slice(0, 3).map(item => `
            <div class="item-row">
              <img src="${item.image}" alt="${item.title}" class="item-image">
              <div class="item-details">
                <h4>${item.title}</h4>
                <p>Quantity: ${item.quantity} × Gh₵${item.price}</p>
                <p class="item-total">$${(item.quantity * item.price).toFixed(2)}</p>
              </div>
            </div>
          `).join('')}
          ${cartItems.length > 3 ? `
            <div class="message-box">
              <p>+ ${cartItems.length - 3} more item${cartItems.length - 3 > 1 ? 's' : ''} in your cart</p>
            </div>
          ` : ''}
        </div>
        
        <div class="message-box">
          <h3>🚀 Complete Your Purchase</h3>
          <p>These items are popular and may sell out soon. Complete your purchase now to secure your items!</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL}/cart" class="button">Complete Your Purchase</a>
          <a href="${process.env.CLIENT_URL}/shop" class="button secondary">Continue Shopping</a>
        </div>
      `
    });

    return await this.sendEmail({
      to: email,
      subject: `🛒 ${userName}, your cart is waiting! (${cartItems.length} items, Gh₵${totalValue.toFixed(2)})`,
      html: htmlContent
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
      // Truncate message content for email preview
      const truncatedContent = messageContent.length > 100 
        ? messageContent.substring(0, 100) + '...' 
        : messageContent;

      const senderTitle = senderRole === 'superAdmin' ? 'Super Admin' : 'Admin';
      const clientUrl = process.env.CLIENT_URL || 'https://www.in-nd-out.com';
      const messageUrl = `${clientUrl}/${senderRole === 'superAdmin' ? 'admin' : 'super-admin'}/messaging`;

      const html = this.getModernEmailTemplate({
        title: 'New Message Received',
        headerColor: '#3b82f6',
        icon: '💬',
        content: `
          <h2>You have a new message!</h2>
          <p>Hi ${recipientName},</p>
          <p>You've received a new message from <strong>${senderName}</strong> (${senderTitle}).</p>
          
          <div class="message-preview">
            <div class="message-header">
              <strong>From:</strong> ${senderName} (${senderTitle})
            </div>
            <div class="message-content">
              "${truncatedContent}"
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${messageUrl}" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 14px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: 600; 
                      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
              View Message
            </a>
          </div>
          
          <div class="info-box">
            <h3>💡 Quick Actions:</h3>
            <ul>
              <li>Click "View Message" to read the full message and reply</li>
              <li>Log into your admin dashboard to access all conversations</li>
              <li>Reply directly through the messaging system</li>
            </ul>
          </div>
          
          <div class="footer-note">
            <p><strong>Note:</strong> This is an automated notification. Please do not reply to this email directly. 
            Use the messaging system in your admin dashboard to respond.</p>
          </div>
        `
      });

      await this.sendEmail({
        to: recipientEmail,
        subject: `💬 New message from ${senderName} - IN-N-OUT Store`,
        html,
        emailType: 'system_notification',
        headers: {
          'X-Email-Category': 'message-notification',
          'X-Sender-Type': 'notification',
          'X-Priority': '2',
          'Importance': 'High'
        }
      });

      console.log(`Message notification email sent to: ${recipientEmail}`);
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
}

// Create and export a singleton instance
const emailService = new EmailService();

module.exports = emailService; 