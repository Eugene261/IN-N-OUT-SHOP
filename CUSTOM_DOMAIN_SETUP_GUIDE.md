# Custom Domain & Business Email Setup Guide

## 🎯 **Overview**
This guide will help you configure your custom domain and Namecheap business email with your Vercel-hosted e-commerce application.

## 📋 **Prerequisites**
- ✅ Domain purchased from Namecheap
- ✅ Business email plan from Namecheap
- ✅ Vercel account with deployed projects
- ✅ Access to Namecheap DNS management

## 🌐 **Step 1: Domain Configuration on Vercel**

### 1.1 Frontend Domain Setup
1. **Login to Vercel Dashboard**
2. **Select your client/frontend project**
3. **Navigate to Settings → Domains**
4. **Add your domains:**
   ```
   yourdomain.com
   www.yourdomain.com
   ```
5. **Vercel will provide DNS records to configure**

### 1.2 Backend API Domain Setup
1. **Select your server/backend project**
2. **Navigate to Settings → Domains**
3. **Add your API subdomain:**
   ```
   api.yourdomain.com
   ```

## 🔧 **Step 2: DNS Configuration on Namecheap**

### 2.1 Access DNS Settings
1. **Login to Namecheap**
2. **Go to Domain List → Manage**
3. **Click Advanced DNS tab**

### 2.2 Add DNS Records
**Replace existing records with these:**

```dns
# Main domain (A Record)
Type: A Record
Host: @
Value: 76.76.19.61
TTL: Automatic

# WWW subdomain (CNAME)
Type: CNAME Record
Host: www
Value: cname.vercel-dns.com
TTL: Automatic

# API subdomain (CNAME)
Type: CNAME Record
Host: api
Value: cname.vercel-dns.com
TTL: Automatic

# Email MX Records (if using Namecheap email)
Type: MX Record
Host: @
Value: mx1.privateemail.com
Priority: 10
TTL: Automatic

Type: MX Record
Host: @
Value: mx2.privateemail.com
Priority: 10
TTL: Automatic
```

## 📧 **Step 3: Business Email Configuration**

### 3.1 Get Email Settings from Namecheap
1. **Login to Namecheap**
2. **Go to Email & Office → Manage**
3. **Note your email settings:**
   ```
   SMTP Server: mail.privateemail.com
   Port: 587 (STARTTLS) or 465 (SSL)
   Security: STARTTLS recommended
   IMAP Server: mail.privateemail.com
   IMAP Port: 993 (SSL) or 143 (STARTTLS)
   ```

### 3.2 Create Email Accounts
Create these recommended email accounts:
- `admin@yourdomain.com` - Administrative notifications
- `noreply@yourdomain.com` - System notifications
- `support@yourdomain.com` - Customer support
- `orders@yourdomain.com` - Order notifications

## ⚙️ **Step 4: Environment Variables Setup**

### 4.1 Server Environment Variables (Vercel)
**In your server project → Settings → Environment Variables:**

```env
# Database
MONGODB_URI=your-mongodb-connection-string

# Authentication
JWT_SECRET=your-32-character-secret-key

# Email Configuration
EMAIL_PROVIDER=custom
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=IN-N-OUT Store <noreply@yourdomain.com>
SUPPORT_EMAIL=support@yourdomain.com
REPLY_TO_EMAIL=support@yourdomain.com

# App URLs
CLIENT_URL=https://yourdomain.com
SERVER_URL=https://api.yourdomain.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Payment (Paystack)
PAYSTACK_SECRET_KEY=your-live-secret-key
PAYSTACK_PUBLIC_KEY=your-live-public-key

# Environment
NODE_ENV=production
```

### 4.2 Client Environment Variables (Vercel)
**In your client project → Settings → Environment Variables:**

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_PAYSTACK_PUBLIC_KEY=your-live-public-key
```

## 🔄 **Step 5: Redeploy Applications**

### 5.1 Redeploy Server
1. **Go to your server project in Vercel**
2. **Click Deployments tab**
3. **Click on latest deployment → Redeploy**

### 5.2 Redeploy Client
1. **Go to your client project in Vercel**
2. **Click Deployments tab**
3. **Click on latest deployment → Redeploy**

## ✅ **Step 6: Verification & Testing**

### 6.1 Domain Verification
**Test these URLs:**
- `https://yourdomain.com` (should load your frontend)
- `https://www.yourdomain.com` (should redirect to main domain)
- `https://api.yourdomain.com/api/health` (should return API status)

### 6.2 Email Testing
**Test email functionality:**
1. **Create a test account** on your site
2. **Verify welcome email** is received
3. **Test password reset** functionality
4. **Place a test order** and verify confirmation email

### 6.3 SSL Certificate Verification
- **Check SSL status** in Vercel dashboard
- **Verify HTTPS** is working for all domains
- **Test redirect** from HTTP to HTTPS

## 🚨 **Common Issues & Solutions**

### Issue: DNS Propagation Delay
**Solution:** DNS changes can take 24-48 hours to propagate globally. Use tools like `nslookup` or online DNS checkers to verify.

### Issue: Email Not Working
**Solutions:**
1. **Verify SMTP credentials** in Namecheap
2. **Check firewall settings** (ensure ports 587/465 are open)
3. **Test with a different email provider** temporarily

### Issue: CORS Errors
**Solution:** Ensure your `CLIENT_URL` environment variable matches your exact domain (with/without www).

### Issue: SSL Certificate Not Issued
**Solution:** 
1. **Wait 24 hours** for DNS propagation
2. **Remove and re-add domain** in Vercel
3. **Check DNS records** are correctly configured

## 📞 **Support Resources**

- **Vercel Documentation:** https://vercel.com/docs
- **Namecheap DNS Guide:** https://www.namecheap.com/support/knowledgebase/
- **Email Testing Tools:** 
  - Mail Tester: https://www.mail-tester.com/
  - MX Toolbox: https://mxtoolbox.com/

## 🔐 **Security Checklist**

- [ ] Strong email passwords
- [ ] JWT secret is 32+ characters
- [ ] Production Paystack keys configured
- [ ] HTTPS enforced on all domains
- [ ] Email SPF/DKIM records configured (optional but recommended)

## 📈 **Post-Deployment Tasks**

1. **Update Google Analytics** (if using) with new domain
2. **Update social media links** and business profiles
3. **Notify customers** of domain change (if applicable)
4. **Set up monitoring** for uptime and errors
5. **Configure backups** for database and files

---

**Need help?** Check the troubleshooting section or create an issue in the project repository. 