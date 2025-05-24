# Email Service Setup Guide

## Overview
The email service supports multiple providers: Gmail, SendGrid, Mailgun, Outlook, and custom SMTP servers.

## Environment Variables Setup

Create a `.env` file in your server directory and add the following variables:

### Basic Configuration
```env
# Choose one email provider: gmail, sendgrid, mailgun, outlook, custom
EMAIL_PROVIDER=gmail

# Client URL for password reset links
CLIENT_URL=http://localhost:3000
```

### Option 1: Gmail (Recommended for Development)
```env
EMAIL_PROVIDER=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

**Gmail Setup Instructions:**
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to "App Passwords" in Security settings
4. Generate an app password for "Mail"
5. Use this app password (not your regular password) in EMAIL_PASSWORD

### Option 2: SendGrid (Recommended for Production)
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=your-verified-sender@yourdomain.com
```

**SendGrid Setup:**
1. Sign up at sendgrid.com
2. Verify your sender identity
3. Generate an API key
4. Use the API key in SENDGRID_API_KEY

### Option 3: Mailgun
```env
EMAIL_PROVIDER=mailgun
MAILGUN_USERNAME=your-mailgun-username
MAILGUN_PASSWORD=your-mailgun-password
EMAIL_FROM=your-verified-sender@yourdomain.com
```

### Option 4: Outlook/Hotmail
```env
EMAIL_PROVIDER=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@outlook.com
```

### Option 5: Custom SMTP
```env
EMAIL_PROVIDER=custom
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=your-email@yourdomain.com
```

## Testing Email Service

Add this test route to test your email configuration:

```javascript
// Add to your routes file
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    await emailService.sendEmail({
      to: email,
      subject: 'Test Email',
      html: '<h1>Email service is working!</h1>'
    });
    res.json({ success: true, message: 'Test email sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## Features Included

1. **Password Reset Emails**: Professional HTML emails with branded design
2. **Welcome Emails**: Sent automatically when users register
3. **Order Confirmation**: Ready to use for order notifications
4. **Error Handling**: Graceful fallbacks if email service fails
5. **Multiple Providers**: Easy switching between email services

## Security Notes

1. Never commit `.env` files to version control
2. Use app passwords instead of regular passwords
3. Verify sender domains for production email services
4. Monitor email sending limits and quotas

## Troubleshooting

1. **Gmail "Less secure apps"**: Use App Passwords instead
2. **SendGrid verification**: Verify your sender identity
3. **SMTP errors**: Check host, port, and authentication settings
4. **Rate limits**: Implement rate limiting for email endpoints 