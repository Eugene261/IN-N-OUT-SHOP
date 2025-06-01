# 🚀 Step-by-Step Vercel Deployment Guide

## Prerequisites
- GitHub account (to push your code)
- Vercel account (free at vercel.com)
- Your code pushed to GitHub

## Step 1: Push Your Code to GitHub

### If you haven't already:
```bash
# In your project root (D:\Ecom)
git init
git add .
git commit -m "Initial commit for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 2: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub" (recommended)
4. Authorize Vercel to access your GitHub

## Step 3: Deploy Backend (API) First

### 3.1 Import Backend Project
1. In Vercel Dashboard, click **"Add New..."** → **"Project"**
2. Find your repository and click **"Import"**
3. In the configuration screen:
   - **Root Directory**: Click "Edit" and select `server`
   - **Framework Preset**: Select "Other"
   - **Build Command**: Leave empty or use `npm install`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

### 3.2 Configure Backend Environment Variables
Click "Environment Variables" and add:

```bash
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secret (generate a secure one)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Paystack TEST Keys
PAYSTACK_SECRET_KEY=sk_test_your_test_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key

# Email Configuration (optional for now)
EMAIL_PROVIDER=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=your_email@gmail.com

# URLs (update after deployment)
CLIENT_URL=http://localhost:5173
SERVER_URL=https://your-backend-url.vercel.app

# Node Environment
NODE_ENV=production
PORT=5000
```

### 3.3 Deploy Backend
1. Click **"Deploy"**
2. Wait for deployment (2-5 minutes)
3. Once deployed, copy your backend URL (e.g., `https://your-app-api.vercel.app`)

## Step 4: Deploy Frontend

### 4.1 Import Frontend Project
1. Click **"Add New..."** → **"Project"** again
2. Select the same repository
3. In configuration:
   - **Root Directory**: Click "Edit" and select `client`
   - **Framework Preset**: Select "Vite"
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 4.2 Configure Frontend Environment Variables
Add these environment variables:

```bash
# API URL (use the backend URL from Step 3.3)
VITE_API_URL=https://your-app-api.vercel.app

# Paystack Public Key (TEST)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key
```

### 4.3 Deploy Frontend
1. Click **"Deploy"**
2. Wait for deployment
3. Your frontend will be available at `https://your-app.vercel.app`

## Step 5: Update Backend CLIENT_URL

### IMPORTANT: Go back to your backend project in Vercel
1. Go to backend project → **Settings** → **Environment Variables**
2. Update `CLIENT_URL` to your frontend URL:
   ```
   CLIENT_URL=https://your-app.vercel.app
   ```
3. Go to **Deployments** tab
4. Click the three dots on latest deployment → **Redeploy**

## Step 6: Test Your Deployment

### Test these features:
- [ ] Homepage loads
- [ ] Can browse products
- [ ] Can register a new account
- [ ] Can login
- [ ] Can add items to cart
- [ ] Can proceed to checkout
- [ ] Test payment with Paystack test card:
  ```
  Card: 4084 0840 8408 4081
  CVV: 408
  Expiry: Any future date
  PIN: 0000
  ```

## Common Issues & Solutions

### 1. API Calls Failing
**Problem**: Frontend can't connect to backend
**Solution**: 
- Check VITE_API_URL in frontend env variables
- Ensure it does NOT have `/api` at the end if your endpoints already include it
- Check CORS settings in backend

### 2. Build Failing
**Problem**: Deployment fails during build
**Solution**:
- Check build logs for specific errors
- Common: Missing dependencies - ensure all are in package.json
- Try building locally first: `npm run build`

### 3. Environment Variables Not Working
**Problem**: App can't find env variables
**Solution**:
- In Vercel, env variables need a redeploy to take effect
- For Vite apps, variables must start with `VITE_`
- Check variable names match exactly (case-sensitive)

### 4. MongoDB Connection Issues
**Problem**: Database connection fails
**Solution**:
- Whitelist Vercel IPs in MongoDB Atlas
- Go to MongoDB Atlas → Network Access → Add IP → Allow from Anywhere (0.0.0.0/0)

## Quick Deployment Checklist

### Before Deployment:
- [ ] Code committed and pushed to GitHub
- [ ] MongoDB Atlas database created
- [ ] Cloudinary account created (for images)
- [ ] Paystack test keys obtained
- [ ] All secrets/keys ready

### During Deployment:
- [ ] Deploy backend first
- [ ] Copy backend URL
- [ ] Deploy frontend with backend URL
- [ ] Update backend CLIENT_URL
- [ ] Redeploy backend

### After Deployment:
- [ ] Test all major features
- [ ] Check console for errors
- [ ] Verify email sending (if configured)
- [ ] Test payment flow

## Your Deployed URLs Will Be:
- **Backend API**: `https://[your-project-name]-api.vercel.app`
- **Frontend**: `https://[your-project-name].vercel.app`

## Next Steps After Successful Deployment:
1. Share your `.vercel.app` URL with friends for testing
2. Monitor the Vercel dashboard for any errors
3. Set up Vercel Analytics (free)
4. Plan for custom domain when ready

## Need Help?
- Vercel Status: [status.vercel.com](https://status.vercel.com)
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Check deployment logs in Vercel dashboard

Remember: You can always redeploy by pushing new commits to GitHub! 