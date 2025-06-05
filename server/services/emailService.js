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

    const defaultOptions = {
      from: `"IN-N-OUT Store" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      replyTo: process.env.REPLY_TO_EMAIL || process.env.EMAIL_FROM || process.env.EMAIL_USER,
      headers: {
        'X-Mailer': 'IN-N-OUT Store v1.0',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'List-Unsubscribe': `<${process.env.CLIENT_URL}/unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Return-Path': process.env.EMAIL_FROM || process.env.EMAIL_USER,
        'Message-ID': `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${process.env.EMAIL_DOMAIN || 'innoutstore.com'}>`,
        'MIME-Version': '1.0',
        'Content-Type': 'text/html; charset=UTF-8',
        'Content-Transfer-Encoding': '8bit'
      }
    };

    const mailOptions = { ...defaultOptions, ...options };

    // Add text version for better deliverability
    if (mailOptions.html && !mailOptions.text) {
      mailOptions.text = this.htmlToText(mailOptions.html);
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
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

  // Modern email template generator with improved design and spam prevention
  getModernEmailTemplate({ title, headerColor, icon, content }) {
    const logoUrl = process.env.LOGO_URL || `${process.env.CLIENT_URL}/favicon.svg`;
    
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
          .logo img {
            width: 36px;
            height: 36px;
            filter: brightness(0) invert(1);
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
          }
          .button:hover {
            background: ${headerColor}dd;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
          }
          .button.secondary {
            background: #6c757d;
            color: #ffffff;
          }
          .button.secondary:hover {
            background: #5a6268;
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
                ${logoUrl.includes('.svg') || logoUrl.includes('.png') || logoUrl.includes('.jpg') ? 
                  `<img src="${logoUrl}" alt="IN-N-OUT Store Logo" />` : 
                  `<span class="icon">${icon}</span>`
                }
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

    return await this.sendEmail({
      to: email,
      subject: 'Password Reset Request - IN-N-OUT Store',
      html: htmlContent
    });
  }

  async sendWelcomeEmail(email, userName) {
    const htmlContent = this.getModernEmailTemplate({
      title: 'Welcome to IN-N-OUT Store!',
      headerColor: '#28a745',
      icon: '🎉',
      content: `
        <div class="notification-header">
          <h2>Welcome ${userName}!</h2>
          <p>Thank you for joining IN-N-OUT Store! Your account has been successfully created.</p>
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
        
        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="button">Start Shopping Now</a>
          <a href="${process.env.CLIENT_URL}/support" class="button secondary">Contact Support</a>
        </div>
      `
    });

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to IN-N-OUT Store! 🎉',
      html: htmlContent
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
        
        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL}/orders/${orderDetails.orderId}" class="button">Track Your Order</a>
          <a href="${process.env.CLIENT_URL}/support" class="button secondary">Contact Support</a>
        </div>
      `
    });

    return await this.sendEmail({
      to: email,
      subject: `Order Confirmation #${orderDetails.orderId} - IN-N-OUT Store`,
      html: htmlContent
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

    return await this.sendEmail({
      to: email,
      subject: `Order Update #${orderDetails.orderId} - ${config.message.replace('!', '')}`,
      html: htmlContent
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
      html: adminHtmlContent
    });

    // Send auto-reply to customer
    return await this.sendEmail({
      to: contactDetails.email,
      subject: '✅ Thank you for contacting IN-N-OUT Store',
      html: customerHtmlContent
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
    const htmlContent = this.getModernEmailTemplate({
      title: 'Newsletter Subscription',
      headerColor: '#6f42c1',
      icon: '📬',
      content: `
        <div class="notification-header">
          <h2>📬 Welcome to our Newsletter!</h2>
          <p>Hi ${userName}, thank you for subscribing to IN-N-OUT Store updates!</p>
        </div>
        
        <div class="newsletter-benefits">
          <h3>🎁 What you'll receive:</h3>
          <ul>
            <li>🛍️ Exclusive deals and early access to sales</li>
            <li>📦 New product announcements</li>
            <li>💡 Shopping tips and product recommendations</li>
            <li>🎉 Special member-only promotions</li>
            <li>📊 Weekly trending products</li>
          </ul>
        </div>
        
        <div class="message-box">
          <h3>📧 Email Preferences</h3>
          <p>You can update your email preferences or unsubscribe at any time using the links in our emails.</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL}/shop" class="button">Start Shopping</a>
          <a href="${process.env.CLIENT_URL}/newsletter/preferences" class="button secondary">Email Preferences</a>
        </div>
      `
    });

    return await this.sendEmail({
      to: email,
      subject: '📬 Welcome to IN-N-OUT Store Newsletter!',
      html: htmlContent
    });
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