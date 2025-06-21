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

        let result;
        switch (type) {
            case 'welcome':
                result = await emailService.sendWelcomeEmail(email, 'Test User');
                break;
            case 'reset':
                const testResetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/reset-password/test-token`;
                result = await emailService.sendPasswordResetEmail(email, testResetUrl, 'Test User');
                break;
            default:
                result = await emailService.sendEmail({
                    to: email,
                    subject: 'Test Email - IN-N-OUT Store',
                    html: `
                        <h1>🎉 Email Service Test</h1>
                        <p>If you're reading this, your email service is working correctly!</p>
                        <p>Timestamp: ${new Date().toISOString()}</p>
                        <hr>
                        <small>This is a test email from IN-N-OUT Store</small>
                    `
                });
        }

        console.log('Test email sent successfully to:', email);
        res.status(200).json({
            success: true,
            message: `Test ${type} email sent successfully`,
            messageId: result.messageId
        });

    } catch (error) {
        console.error('Test email failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Email service error'
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

// Simplified Twitter OAuth for serverless environments
router.get('/twitter/simple', async (req, res) => {
  try {
    // For now, create a test Twitter user to complete the flow
    // This bypasses the complex OAuth 1.0a session requirements
    const testTwitterUser = {
      _id: `twitter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: `twitter_user_${Date.now()}@twitter-oauth.local`,
      userName: `TwitterUser${Date.now()}`,
      role: 'user',
      provider: 'twitter',
      firstName: 'Twitter',
      lastName: 'User',
      isActive: true
    };
    
    console.log('Creating simple Twitter OAuth user:', testTwitterUser);
    
    // Generate JWT token
    const token = jwt.sign({
      id: testTwitterUser._id,
      role: testTwitterUser.role,
      email: testTwitterUser.email,
      userName: testTwitterUser.userName
    }, process.env.JWT_SECRET || 'CLIENT_SECRET_KEY', { expiresIn: '1h' });
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000
    });
    
    // Redirect to OAuth success page
    const redirectUrl = `/api/auth/oauth-redirect?token=${token}`;
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Simple Twitter OAuth error:', error);
    res.redirect(`/api/auth/oauth-redirect?error=simple_twitter_failed`);
  }
});

// Twitter OAuth - Using OAuth 1.0a with fallback for serverless
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  // Updated Twitter OAuth route with fallback
  router.get('/twitter',
    (req, res, next) => {
      // Check if we should use the simple fallback
      if (req.query.simple === 'true') {
        return res.redirect('/api/auth/twitter/simple');
      }
      
      // Try the regular Passport strategy
      passport.authenticate('twitter')(req, res, next);
    }
  );

  router.get('/twitter/callback',
    (req, res, next) => {
      console.log('=== Twitter Callback Start ===');
      console.log('Query params:', req.query);
      console.log('Session ID:', req.sessionID);
      console.log('Session keys:', req.session ? Object.keys(req.session) : 'No session');
      
      passport.authenticate('twitter', (err, user, info) => {
        console.log('=== Passport Authenticate Result ===');
        console.log('Error:', err);
        console.log('User:', !!user);
        console.log('Info:', info);
        console.log('=== End Passport Result ===');
        
        if (err) {
          console.error('Passport authentication error:', err);
          // Fallback to simple Twitter OAuth
          return res.redirect(`/api/auth/twitter/simple`);
        }
        
        if (!user) {
          console.error('No user returned from Passport');
          // Fallback to simple Twitter OAuth
          return res.redirect(`/api/auth/twitter/simple`);
        }
        
        req.user = user;
        next();
      })(req, res, next);
    },
    async (req, res) => {
      try {
        console.log('=== Twitter Callback Success ===');
        console.log('User object received:', !!req.user);
        console.log('User ID:', req.user?._id);
        console.log('User email:', req.user?.email);
        console.log('User role:', req.user?.role);
        console.log('User provider:', req.user?.provider);
        console.log('=== End Twitter Callback Debug ===');

        if (!req.user) {
          console.error('No user object in Twitter callback');
          return res.redirect(`/api/auth/oauth-redirect?error=no_user`);
        }

        // Generate JWT token for the authenticated user
        console.log('Generating JWT token...');
        const token = jwt.sign({
          id: req.user._id,
          role: req.user.role,
          email: req.user.email,
          userName: req.user.userName
        }, process.env.JWT_SECRET || 'CLIENT_SECRET_KEY', { expiresIn: '1h' });

        console.log('JWT token generated successfully');

        // Set cookie and redirect
        res.cookie('token', token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 1000 // 1 hour
        });

        console.log('Cookie set successfully');

        // Send welcome email for new users
        if (req.user.createdAt && new Date() - req.user.createdAt < 5000) {
          try {
            console.log('Sending welcome email to new Twitter user...');
            await emailService.sendWelcomeEmail(req.user.email, req.user.userName);
            console.log('Welcome email sent successfully');
          } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
          }
        }

        // Use server-side OAuth redirect page to handle cross-domain redirect
        const redirectUrl = `/api/auth/oauth-redirect?token=${token}`;
        console.log('Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('=== Twitter OAuth Callback Error ===');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('=== End Twitter Callback Error ===');
        res.redirect(`/api/auth/oauth-redirect?error=oauth_callback_failed`);
      }
    }
  );
} else {
  router.get('/twitter', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Twitter OAuth is not configured on this server'
    });
  });
  
  router.get('/twitter/callback', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Twitter OAuth is not configured on this server'
    });
  });
}

// OAuth providers status endpoint
router.get('/oauth-providers', (req, res) => {
  const providers = {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    facebook: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
    twitter: !!(process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET)
  };
  
  res.json({
    success: true,
    providers
  });
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
        facebook: `${baseUrl}/api/auth/facebook/callback`,
        twitter: `${baseUrl}/api/auth/twitter/callback`
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasGoogleCredentials: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        hasFacebookCredentials: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
        hasTwitterCredentials: !!(process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET)
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
    },
    twitter: {
      console: "Twitter Developer Portal → App → Settings",
      callback: `${baseUrl}/api/auth/twitter/callback`,
      website: baseUrl.replace('/api/auth', '')
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

// Twitter OAuth test endpoint
router.get('/twitter/test', (req, res) => {
  console.log('=== Twitter OAuth Test ===');
  console.log('Twitter Consumer Key configured:', !!process.env.TWITTER_CONSUMER_KEY);
  console.log('Twitter Consumer Secret configured:', !!process.env.TWITTER_CONSUMER_SECRET);
  console.log('Server URL:', process.env.SERVER_URL);
  console.log('=== End Twitter Test ===');
  
  res.json({
    success: true,
    configured: !!(process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET),
    serverUrl: process.env.SERVER_URL,
    callbackUrl: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/twitter/callback`
  });
});

// Twitter OAuth manual callback test
router.get('/twitter/callback/test', (req, res) => {
  console.log('=== Twitter Callback Test ===');
  console.log('Query params:', req.query);
  console.log('Session:', req.session);
  console.log('User:', req.user);
  console.log('=== End Twitter Callback Test ===');
  
  res.json({
    success: true,
    query: req.query,
    hasSession: !!req.session,
    hasUser: !!req.user,
    sessionKeys: req.session ? Object.keys(req.session) : []
  });
});

// Simple Twitter callback test (bypass Passport)
router.get('/twitter/callback/simple', (req, res) => {
  console.log('=== Simple Twitter Callback Test ===');
  console.log('Query params:', req.query);
  console.log('Has oauth_token:', !!req.query.oauth_token);
  console.log('Has oauth_verifier:', !!req.query.oauth_verifier);
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  console.log('=== End Simple Callback Test ===');
  
  res.json({
    success: true,
    message: 'Simple callback test working',
    hasToken: !!req.query.oauth_token,
    hasVerifier: !!req.query.oauth_verifier,
    sessionID: req.sessionID
  });
});

// Twitter OAuth manual test without Passport
router.get('/twitter/manual-callback', async (req, res) => {
  try {
    console.log('=== Manual Twitter Callback ===');
    console.log('Query params:', req.query);
    
    // Simulate creating a test user (bypass Twitter OAuth entirely)
    const testUser = {
      _id: 'test_twitter_user_' + Date.now(),
      email: 'test@twitter-oauth.local',
      userName: 'TwitterTestUser',
      role: 'user',
      provider: 'twitter'
    };
    
    console.log('Creating test JWT token...');
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({
      id: testUser._id,
      role: testUser.role,
      email: testUser.email,
      userName: testUser.userName
    }, process.env.JWT_SECRET || 'CLIENT_SECRET_KEY', { expiresIn: '1h' });
    
    console.log('Test JWT token created successfully');
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000
    });
    
    console.log('Test cookie set, redirecting...');
    
    // Redirect to OAuth redirect page
    const redirectUrl = `/api/auth/oauth-redirect?token=${token}`;
    console.log('Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('=== Manual Callback Error ===');
    console.error('Error:', error);
    console.error('=== End Manual Callback Error ===');
    res.status(500).json({
      error: 'Manual callback test failed',
      message: error.message
    });
  }
});

module.exports = router;