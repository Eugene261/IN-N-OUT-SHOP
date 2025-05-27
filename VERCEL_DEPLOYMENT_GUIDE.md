# 🚀 Vercel Deployment Guide with Custom Domain & Mail Service

## 📋 Prerequisites Checklist

Before deploying, ensure you have:
- [ ] GitHub repository with your code
- [ ] MongoDB Atlas database (or other cloud MongoDB)
- [ ] All environment variables documented
- [ ] Custom domain purchased
- [ ] Mail service provider chosen

## 🏗️ Part 1: Preparing Your Application for Vercel

### 1.1 Frontend (Client) Preparation

#### Create `vercel.json` in client directory:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "@api_url"
  }
}
```

#### Update `package.json` build script:
```json
{
  "scripts": {
    "build": "vite build",
    "build-vercel": "npm run build"
  }
}
```

#### Create environment variables file template:
```bash
# client/.env.production
VITE_API_URL=https://your-api-domain.vercel.app
VITE_APP_URL=https://your-domain.com
```

### 1.2 Backend (Server) Preparation

#### Create `vercel.json` in server directory:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### Update CORS configuration in server:
```javascript
// server/index.js or server/app.js
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://your-domain.com',
    'https://www.your-domain.com',
    'https://your-vercel-app.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

app.use(cors(corsOptions));
```

## 🌐 Part 2: Vercel Deployment Steps

### 2.1 Deploy Backend (API)

1. **Create Vercel Account**: Sign up at [vercel.com](https://vercel.com)

2. **Connect GitHub**: Link your GitHub account

3. **Import Backend Project**:
   - Click "New Project"
   - Select your repository
   - Choose the `server` folder as root directory
   - Framework Preset: "Other"

4. **Configure Environment Variables**:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   JWT_SECRET=your-super-secret-jwt-key
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   EMAIL_SERVICE_API_KEY=your-email-service-key
   EMAIL_FROM=noreply@your-domain.com
   CLIENT_URL=https://your-domain.com
   ```

5. **Deploy**: Click "Deploy"

6. **Note the API URL**: Save the generated URL (e.g., `https://your-api.vercel.app`)

### 2.2 Deploy Frontend

1. **Import Frontend Project**:
   - Click "New Project"
   - Select your repository
   - Choose the `client` folder as root directory
   - Framework Preset: "Vite"

2. **Configure Environment Variables**:
   ```
   VITE_API_URL=https://your-api.vercel.app
   VITE_APP_URL=https://your-domain.com
   ```

3. **Deploy**: Click "Deploy"

4. **Note the Frontend URL**: Save the generated URL

## 🏷️ Part 3: Custom Domain Setup

### 3.1 Purchase Domain
Choose a domain registrar:
- **Namecheap** (recommended for beginners)
- **GoDaddy**
- **Google Domains**
- **Cloudflare Registrar**

### 3.2 Configure Domain in Vercel

1. **Frontend Domain Setup**:
   - Go to your frontend project in Vercel
   - Click "Settings" → "Domains"
   - Add your domain: `your-domain.com`
   - Add www subdomain: `www.your-domain.com`

2. **Backend Subdomain Setup**:
   - Go to your backend project in Vercel
   - Click "Settings" → "Domains"
   - Add API subdomain: `api.your-domain.com`

3. **DNS Configuration**:
   In your domain registrar's DNS settings, add:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com

   Type: CNAME
   Name: api
   Value: cname.vercel-dns.com
   ```

### 3.3 Update Environment Variables

After domain setup, update:

**Frontend**:
```
VITE_API_URL=https://api.your-domain.com
VITE_APP_URL=https://your-domain.com
```

**Backend**:
```
CLIENT_URL=https://your-domain.com
```

## 📧 Part 4: Mail Service Setup

### 4.1 Choose Mail Service Provider

#### Option A: SendGrid (Recommended)
- **Pros**: Reliable, good free tier, easy setup
- **Pricing**: Free tier (100 emails/day), paid plans from $14.95/month
- **Setup**: 
  1. Sign up at [sendgrid.com](https://sendgrid.com)
  2. Verify your domain
  3. Get API key

#### Option B: Mailgun
- **Pros**: Developer-friendly, good documentation
- **Pricing**: Pay-as-you-go, $0.80/1000 emails
- **Setup**:
  1. Sign up at [mailgun.com](https://mailgun.com)
  2. Add and verify domain
  3. Get API credentials

#### Option C: Amazon SES
- **Pros**: Very cheap, highly scalable
- **Pricing**: $0.10/1000 emails
- **Setup**:
  1. AWS account required
  2. More complex setup
  3. Need to request production access

### 4.2 Domain Verification for Email

#### For SendGrid:
1. **Add DNS Records**:
   ```
   Type: CNAME
   Name: em1234
   Value: u1234567.wl123.sendgrid.net

   Type: CNAME
   Name: s1._domainkey
   Value: s1.domainkey.u1234567.wl123.sendgrid.net

   Type: CNAME
   Name: s2._domainkey
   Value: s2.domainkey.u1234567.wl123.sendgrid.net
   ```

2. **Update Environment Variables**:
   ```
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=your-sendgrid-api-key
   EMAIL_FROM=noreply@your-domain.com
   EMAIL_FROM_NAME=Your App Name
   ```

### 4.3 Update Email Service Configuration

#### Update your email service file:
```javascript
// server/services/emailService.js
const sgMail = require('@sendgrid/mail');

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, html, text) => {
  try {
    const msg = {
      to,
      from: {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_FROM_NAME || 'Your App'
      },
      subject,
      text,
      html,
    };

    await sgMail.send(msg);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = { sendEmail };
```

## 🔧 Part 5: Environment Variables Complete List

### Backend Environment Variables:
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# File Upload
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Email Service
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@your-domain.com
EMAIL_FROM_NAME=Your App Name

# App URLs
CLIENT_URL=https://your-domain.com
SERVER_URL=https://api.your-domain.com

# Node Environment
NODE_ENV=production
PORT=5000
```

### Frontend Environment Variables:
```bash
# API Configuration
VITE_API_URL=https://api.your-domain.com
VITE_APP_URL=https://your-domain.com

# Optional: Analytics, etc.
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
```

## 🧪 Part 6: Testing Deployment

### 6.1 Pre-deployment Checklist
- [ ] All environment variables set
- [ ] CORS configured for production domains
- [ ] Database accessible from Vercel
- [ ] Email service configured and tested
- [ ] Domain DNS propagated (can take 24-48 hours)

### 6.2 Test Scenarios
1. **Authentication**: Login/register/logout
2. **File Uploads**: Product images, avatars
3. **Email Sending**: Registration, password reset
4. **Database Operations**: CRUD operations
5. **API Endpoints**: All major endpoints
6. **Cross-origin Requests**: Frontend to backend communication

### 6.3 Common Issues & Solutions

#### CORS Errors:
```javascript
// Add to server CORS config
origin: [
  process.env.CLIENT_URL,
  'https://your-domain.com',
  'https://www.your-domain.com'
]
```

#### Environment Variable Issues:
- Redeploy after adding new environment variables
- Check variable names match exactly
- Ensure no trailing spaces in values

#### Database Connection Issues:
- Whitelist Vercel IP ranges in MongoDB Atlas
- Or use `0.0.0.0/0` for all IPs (less secure)

## 📊 Part 7: Monitoring & Maintenance

### 7.1 Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor performance and errors

### 7.2 Error Tracking
Consider adding:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Vercel Analytics** for performance

### 7.3 Backup Strategy
- Regular database backups
- Environment variables backup
- Code repository backup

## 💰 Part 8: Cost Estimation

### Vercel Costs:
- **Hobby Plan**: Free (good for personal projects)
- **Pro Plan**: $20/month per user (commercial use)

### Domain Costs:
- **.com domain**: $10-15/year
- **Premium domains**: $20-100+/year

### Email Service Costs:
- **SendGrid**: Free (100 emails/day) → $14.95/month (40,000 emails)
- **Mailgun**: $0.80/1000 emails
- **Amazon SES**: $0.10/1000 emails

### Database Costs:
- **MongoDB Atlas**: Free tier (512MB) → $9/month (2GB)

**Total Monthly Cost Estimate**: $0-50/month depending on usage

## 🚀 Part 9: Go-Live Checklist

### Final Steps:
- [ ] All tests passing
- [ ] Performance optimized
- [ ] SEO meta tags added
- [ ] SSL certificates active
- [ ] Email templates tested
- [ ] Error pages configured
- [ ] Analytics tracking setup
- [ ] Backup systems in place
- [ ] Documentation updated
- [ ] Team access configured

### Post-Launch:
- [ ] Monitor error rates
- [ ] Check email deliverability
- [ ] Monitor performance metrics
- [ ] Set up alerts for downtime
- [ ] Plan regular updates

---

## 📞 Support Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **SendGrid Documentation**: [docs.sendgrid.com](https://docs.sendgrid.com)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Domain Help**: Your registrar's support

Remember to keep all credentials secure and never commit them to your repository! 