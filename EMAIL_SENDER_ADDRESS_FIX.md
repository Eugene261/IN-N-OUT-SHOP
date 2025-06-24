# Email Sender Address Rejection Fix

## Issue Description

**Error Message:**
```
553 5.7.1 <eugene@in-nd-out.com>: Sender address rejected: not owned by user noreply@in-nd-out.com
```

This error occurs when the email service tries to send emails from an address (`eugene@in-nd-out.com`) that doesn't match the authenticated user account (`noreply@in-nd-out.com`).

## Root Cause

The issue happens when:
1. The `EMAIL_USER` environment variable is set to the authenticated email address (e.g., `noreply@in-nd-out.com`)
2. But the email service tries to send emails from a different address (e.g., `eugene@in-nd-out.com`)
3. The email provider (Gmail, SendGrid, etc.) rejects this because the "from" address must match the authenticated user

## Solution Applied

### 1. Fixed Email Service Configuration

**File:** `server/services/emailService.js`

**Change:** Updated the `getSenderConfig` method to always use the authenticated email address for the "from" field:

```javascript
// Before (PROBLEMATIC)
'welcome': {
  from: `"Eugene at IN-N-OUT Store" <${emailUser}>`,  // Used EMAIL_USER directly
  replyTo: `eugene@${baseDomain}`,
}

// After (FIXED)
'welcome': {
  from: `"Eugene at IN-N-OUT Store" <${authenticatedFrom}>`,  // Uses EMAIL_FROM || EMAIL_USER
  replyTo: `eugene@${baseDomain}`,  // Reply-to can be different
}
```

**Key Changes:**
- Added `authenticatedFrom = process.env.EMAIL_FROM || emailUser` variable
- All `from` fields now use `authenticatedFrom` instead of `emailUser`
- `replyTo` fields remain as personal addresses for better user experience

### 2. Environment Variables Configuration

**Required Setup:**
```env
# Email Authentication (MUST MATCH)
EMAIL_USER=noreply@in-nd-out.com
EMAIL_FROM=noreply@in-nd-out.com

# Email Provider Settings
EMAIL_PROVIDER=gmail
EMAIL_PASSWORD=your-app-password

# Optional: Custom domain for reply-to addresses
EMAIL_DOMAIN=in-nd-out.com
```

**Important:** `EMAIL_FROM` must match `EMAIL_USER` to prevent sender address rejection.

## Testing the Fix

### 1. Run Email Configuration Diagnostic
```bash
cd server
node scripts/checkEmailConfig.js
```

### 2. Test Email Sending
```bash
cd server
node scripts/test-email.js your-email@example.com welcome
```

### 3. Check Logs
Look for these success messages:
```
✅ Email sent successfully: <message-id>
📧 Anti-spam headers applied for better deliverability
```

## Email Provider Specific Notes

### Gmail Configuration
```env
EMAIL_PROVIDER=gmail
EMAIL_USER=your-gmail@gmail.com
EMAIL_FROM=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

**Requirements:**
- 2-Factor Authentication enabled
- App Password generated (not regular password)
- `EMAIL_FROM` must match `EMAIL_USER`

### SendGrid Configuration
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=your-verified-sender@yourdomain.com
```

**Requirements:**
- Sender identity verified in SendGrid
- `EMAIL_FROM` must be a verified sender

### Custom SMTP Configuration
```env
EMAIL_PROVIDER=custom
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@yourdomain.com
EMAIL_FROM=your-email@yourdomain.com
EMAIL_PASSWORD=your-password
```

## User Experience Improvements

Even though we fixed the "from" address to use the authenticated account, users will still see personalized sender names:

- **Welcome emails:** "Eugene at IN-N-OUT Store <noreply@in-nd-out.com>"
- **Order emails:** "IN-N-OUT Store Orders <noreply@in-nd-out.com>"
- **Support emails:** "Eugene - Customer Support <noreply@in-nd-out.com>"

**Reply-to addresses** remain personalized:
- Welcome emails: Reply to `eugene@in-nd-out.com`
- Order emails: Reply to `orders@in-nd-out.com`
- Support emails: Reply to `support@in-nd-out.com`

## Verification Checklist

- [ ] `EMAIL_FROM` matches `EMAIL_USER` in environment variables
- [ ] Email service diagnostic passes (`node scripts/checkEmailConfig.js`)
- [ ] Test email sends successfully
- [ ] No "sender address rejected" errors in logs
- [ ] Email deliverability improved (check spam folder)

## Common Troubleshooting

### Error: "EAUTH - Invalid login"
- **Cause:** Wrong email or password
- **Fix:** Verify `EMAIL_USER` and `EMAIL_PASSWORD`
- **Gmail:** Use App Password, not regular password

### Error: "ECONNECTION - Connection timeout"
- **Cause:** SMTP server unreachable
- **Fix:** Check `SMTP_HOST`, `SMTP_PORT`, and internet connection

### Error: "5.7.1 Sender address rejected"
- **Cause:** `EMAIL_FROM` doesn't match authenticated user
- **Fix:** Set `EMAIL_FROM=EMAIL_USER` in environment variables

## Implementation Benefits

1. **Eliminates sender address rejection errors**
2. **Improves email deliverability**
3. **Maintains professional appearance with personalized sender names**
4. **Preserves user-friendly reply-to addresses**
5. **Works with all major email providers**

The fix ensures reliable email delivery while maintaining a professional and personalized email experience for users. 