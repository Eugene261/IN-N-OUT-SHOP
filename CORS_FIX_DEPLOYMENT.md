# CORS Fix and Deployment Guide

## Problem
The application is experiencing CORS (Cross-Origin Resource Sharing) errors when deployed to production. The frontend at `https://www.in-nd-out.com` cannot access the backend at `https://api.in-nd-out.com` due to missing CORS headers.

## Root Cause
1. Server CORS configuration may not be working properly in production
2. Environment variables may not be correctly set in Vercel
3. Preflight OPTIONS requests may not be handled correctly

## Fixes Applied

### 1. Updated Server CORS Configuration
- Enhanced CORS middleware with explicit origin checking
- Added fallback CORS headers middleware
- Added explicit OPTIONS request handler
- Improved logging for CORS debugging

### 2. Required Environment Variables

#### Server (api.in-nd-out.com)
Set these environment variables in your Vercel deployment for the server:

```
CLIENT_URL=https://www.in-nd-out.com
NODE_ENV=production
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
```

#### Client (www.in-nd-out.com)
Set these environment variables in your Vercel deployment for the client:

```
VITE_API_URL=https://api.in-nd-out.com
VITE_APP_URL=https://www.in-nd-out.com
```

## Deployment Steps

### 1. Deploy Server Changes
```bash
cd server
git add .
git commit -m "Fix CORS configuration for production"
git push origin main
```

### 2. Update Vercel Environment Variables

#### For Server Project (api.in-nd-out.com):
1. Go to Vercel Dashboard → Your Server Project → Settings → Environment Variables
2. Add/Update these variables:
   - `CLIENT_URL` = `https://www.in-nd-out.com`
   - `NODE_ENV` = `production`
   - (Ensure all other required env vars are set)

#### For Client Project (www.in-nd-out.com):
1. Go to Vercel Dashboard → Your Client Project → Settings → Environment Variables
2. Add/Update these variables:
   - `VITE_API_URL` = `https://api.in-nd-out.com`
   - `VITE_APP_URL` = `https://www.in-nd-out.com`

### 3. Redeploy Both Projects
After updating environment variables, trigger a new deployment for both projects:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click "Redeploy" on the latest deployment
3. Or push a new commit to trigger automatic deployment

### 4. Verify CORS Fix
1. Open browser developer tools
2. Navigate to `https://www.in-nd-out.com`
3. Check for CORS errors in the console
4. Verify API requests are successful

## Testing the Fix

### 1. Check API Connectivity
Test the API directly:
```bash
curl -H "Origin: https://www.in-nd-out.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     https://api.in-nd-out.com/api/auth/check-auth
```

### 2. Browser Console Verification
Look for these logs in the browser console:
- `✅ CORS: Allowing origin: https://www.in-nd-out.com`
- Successful API requests without CORS errors

### 3. Network Tab Verification
1. Open Developer Tools → Network tab
2. Refresh the page
3. Check that API requests return proper CORS headers:
   - `Access-Control-Allow-Origin: https://www.in-nd-out.com`
   - `Access-Control-Allow-Credentials: true`

## Additional Troubleshooting

### If CORS Issues Persist:

1. **Check Vercel Function Logs:**
   ```bash
   vercel logs https://api.in-nd-out.com
   ```

2. **Verify Environment Variables:**
   - Check Vercel dashboard for correct env vars
   - Ensure no typos in URLs
   - Verify all required variables are set

3. **Clear Browser Cache:**
   - Hard refresh (Ctrl+F5 or Cmd+R)
   - Clear browser cache and cookies
   - Try incognito/private browsing mode

4. **DNS and SSL Issues:**
   - Verify both domains are properly configured
   - Check SSL certificates are valid
   - Ensure DNS is pointing to correct Vercel deployments

### Common Issues:

1. **Environment Variable Not Set:**
   - Missing `CLIENT_URL` on server
   - Missing `VITE_API_URL` on client

2. **Wrong URL Format:**
   - Ensure URLs include `https://`
   - Check for trailing slashes
   - Verify exact domain names

3. **Caching Issues:**
   - Vercel edge cache may need time to update
   - Browser cache may serve old content

## Success Indicators

✅ No CORS errors in browser console
✅ API requests complete successfully
✅ Authentication flows work properly
✅ App loads and functions normally

## Next Steps

1. Deploy the server changes
2. Update environment variables in Vercel
3. Redeploy both projects
4. Test the application
5. Monitor for any remaining issues

If issues persist, check the Vercel function logs and browser developer tools for additional debugging information. 