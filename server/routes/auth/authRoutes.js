const express = require('express');
const { registerUser, loginUser, logoutUser, authMiddleware, forgotPassword, verifyResetToken, resetPassword } = require('../../controllers/authController');
const { authRateLimiter } = require('../../Middleware/rateLimiter');
const emailService = require('../../services/emailService');
const passport = require('../../config/passport');
const jwt = require('jsonwebtoken');

const router = express.Router()

router.post('/register', authRateLimiter, registerUser);
router.post('/login', authRateLimiter, loginUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.get('/verify-reset-token/:token', verifyResetToken);
router.post('/reset-password', authRateLimiter, resetPassword);
router.get('/check-auth', authMiddleware, (req, res) => {
    console.log('Check-auth endpoint hit successfully');
    const user = req.user;
    res.status(200).json({
        success : true,
        message :'Authenticated user',
        user,
    });
});

// Add a simple test endpoint that doesn't require auth
router.get('/test', (req, res) => {
    console.log('Test endpoint hit');
    res.status(200).json({
        success: true,
        message: 'Auth routes working',
        timestamp: new Date().toISOString()
    });
});

// Test email endpoint (for development/testing)
router.post('/test-email', authRateLimiter, async (req, res) => {
    const { email, type = 'test' } = req.body;
    
    try {
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        console.log('=== EMAIL TEST DEBUG ===');
        console.log('EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER);
        console.log('SMTP_HOST:', process.env.SMTP_HOST);
        console.log('EMAIL_USER:', process.env.EMAIL_USER);
        console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
        console.log('Has EMAIL_PASSWORD:', !!process.env.EMAIL_PASSWORD);

        let result;
        switch (type) {
            case 'welcome':
                console.log('Testing welcome email to:', email);
                result = await emailService.sendWelcomeEmail(email, 'Test User');
                break;
            case 'reset':
                const testResetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/reset-password/test-token`;
                result = await emailService.sendPasswordResetEmail(email, testResetUrl, 'Test User');
                break;
            default:
                console.log('Testing basic email to:', email);
                result = await emailService.sendEmail({
                    to: email,
                    subject: 'Test Email - IN-N-OUT Store',
                    html: `
                        <h1>🎉 Email Service Test</h1>
                        <p>If you're reading this, your email service is working correctly!</p>
                        <p>Timestamp: ${new Date().toISOString()}</p>
                        <p>EMAIL_PROVIDER: ${process.env.EMAIL_PROVIDER}</p>
                        <hr>
                        <small>This is a test email from IN-N-OUT Store</small>
                    `
                });
        }

        console.log('Test email sent successfully to:', email);
        res.status(200).json({
            success: true,
            message: `Test ${type} email sent successfully`,
            messageId: result.messageId,
            debug: {
                emailProvider: process.env.EMAIL_PROVIDER,
                emailUser: process.env.EMAIL_USER,
                smtpHost: process.env.SMTP_HOST
            }
        });

    } catch (error) {
        console.error('Test email failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Email service error',
            details: error.stack
        });
    }
});

// OAuth Routes - Only register if OAuth strategies are configured

// Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: `/api/auth/oauth-redirect?error=oauth_failed` }),
    async (req, res) => {
      try {
        // Generate JWT token for the authenticated user
        const token = jwt.sign({
          id: req.user._id,
          role: req.user.role,
          email: req.user.email,
          userName: req.user.userName
        }, process.env.JWT_SECRET || 'CLIENT_SECRET_KEY', { expiresIn: '1h' });

        // Set cookie and redirect
        res.cookie('token', token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 1000 // 1 hour
        });

        // Send welcome email for new users
        if (req.user.createdAt && new Date() - req.user.createdAt < 5000) {
          try {
            await emailService.sendWelcomeEmail(req.user.email, req.user.userName);
          } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
          }
        }

        // Use server-side OAuth redirect page to handle cross-domain redirect
        const redirectUrl = `/api/auth/oauth-redirect?token=${token}`;
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`/api/auth/oauth-redirect?error=oauth_callback_failed`);
      }
    }
  );
} else {
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured on this server'
    });
  });
  
  router.get('/google/callback', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured on this server'
    });
  });
}

// Facebook OAuth
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  router.get('/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
  );

  router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: `/api/auth/oauth-redirect?error=oauth_failed` }),
    async (req, res) => {
      try {
        // Generate JWT token for the authenticated user
        const token = jwt.sign({
          id: req.user._id,
          role: req.user.role,
          email: req.user.email,
          userName: req.user.userName
        }, process.env.JWT_SECRET || 'CLIENT_SECRET_KEY', { expiresIn: '1h' });

        // Set cookie and redirect
        res.cookie('token', token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 1000 // 1 hour
        });

        // Send welcome email for new users
        if (req.user.createdAt && new Date() - req.user.createdAt < 5000) {
          try {
            await emailService.sendWelcomeEmail(req.user.email, req.user.userName);
          } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
          }
        }

        // Use server-side OAuth redirect page to handle cross-domain redirect
        const redirectUrl = `/api/auth/oauth-redirect?token=${token}`;
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`/api/auth/oauth-redirect?error=oauth_callback_failed`);
      }
    }
  );
} else {
  router.get('/facebook', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Facebook OAuth is not configured on this server'
    });
  });
  
  router.get('/facebook/callback', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Facebook OAuth is not configured on this server'
    });
  });
}

// Twitter OAuth temporarily disabled
router.get('/twitter', (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Twitter OAuth is temporarily disabled'
  });
});

router.get('/twitter/callback', (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Twitter OAuth is temporarily disabled'
  });
});

// OAuth providers status endpoint
router.get('/oauth-providers', (req, res) => {
  try {
    console.log('🔍 OAuth providers endpoint called');
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      FACEBOOK_APP_ID: !!process.env.FACEBOOK_APP_ID,
      FACEBOOK_APP_SECRET: !!process.env.FACEBOOK_APP_SECRET
    });

    const providers = {
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      facebook: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
      twitter: false // Temporarily disabled
    };

    console.log('✅ OAuth providers calculated:', providers);
    
    const response = {
      success: true,
      providers,
      debug: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        hasAnyProvider: !!(providers.google || providers.facebook || providers.twitter)
      }
    };

    console.log('📤 Sending OAuth providers response:', response);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ OAuth providers endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check OAuth providers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      providers: {
        google: false,
        facebook: false,
        twitter: false
      }
    });
  }
});

// Debug endpoint for OAuth callback URLs
router.get('/debug/oauth-urls', (req, res) => {
  const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  
  res.json({
    success: true,
    urls: {
      serverUrl: baseUrl,
      clientUrl: clientUrl,
      callbacks: {
        google: `${baseUrl}/api/auth/google/callback`,
        facebook: `${baseUrl}/api/auth/facebook/callback`
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasGoogleCredentials: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        hasFacebookCredentials: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
        twitterDisabled: true
      }
    }
  });
});

// Current OAuth callback URLs for easy copy-paste
router.get('/debug/callback-urls', (req, res) => {
  const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';
  
  res.json({
    success: true,
    message: "Copy these URLs to your OAuth provider consoles",
    google: {
      console: "Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs",
      callback: `${baseUrl}/api/auth/google/callback`
    },
    facebook: {
      console: "Facebook Developer Console → App → Facebook Login → Settings",
      callback: `${baseUrl}/api/auth/facebook/callback`
    }
  });
});

// OAuth success endpoint for client-side token handling
router.get('/oauth-success', (req, res) => {
  res.json({
    success: true,
    message: 'OAuth authentication successful',
    redirect: process.env.CLIENT_URL || 'http://localhost:5173'
  });
});

// Server-side OAuth success page that redirects to client
router.get('/oauth-redirect', (req, res) => {
  const { token, error } = req.query;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  
  console.log('=== OAuth Redirect Debug ===');
  console.log('Query params:', req.query);
  console.log('Token present:', !!token);
  console.log('Error present:', !!error);
  console.log('Client URL:', clientUrl);
  console.log('=== End OAuth Redirect Debug ===');
  
  if (error) {
    console.log('Redirecting with error:', error);
    return res.redirect(`${clientUrl}/auth/login?error=${error}`);
  }
  
  if (!token) {
    console.log('Missing token, redirecting to login');
    return res.redirect(`${clientUrl}/auth/login?error=missing_token`);
  }
  
  // Create a simple HTML page that redirects to client with token
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Redirecting...</title>
      <meta http-equiv="refresh" content="0; url=${clientUrl}/auth/oauth-success?token=${token}">
    </head>
    <body>
      <p>Redirecting to your account...</p>
      <p>If you are not redirected automatically, <a href="${clientUrl}/auth/oauth-success?token=${token}">click here</a>.</p>
      <script>
        console.log('OAuth redirect - Token received, redirecting to client...');
        // Fallback redirect
        setTimeout(() => {
          window.location.href = "${clientUrl}/auth/oauth-success?token=${token}";
        }, 1000);
      </script>
    </body>
    </html>
  `;
  
  console.log('Sending OAuth redirect HTML page');
  res.send(html);
});

module.exports = router;
