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
    passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/login?error=oauth_failed` }),
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

        // Redirect to client with success
        const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/oauth-success?token=${token}`;
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/login?error=oauth_callback_failed`);
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
    passport.authenticate('facebook', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/login?error=oauth_failed` }),
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

        // Redirect to client with success
        const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/oauth-success?token=${token}`;
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/login?error=oauth_callback_failed`);
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

// Twitter OAuth
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  router.get('/twitter',
    passport.authenticate('twitter')
  );

  router.get('/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/login?error=oauth_failed` }),
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

        // Redirect to client with success
        const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/oauth-success?token=${token}`;
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/login?error=oauth_callback_failed`);
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

// OAuth success endpoint for client-side token handling
router.get('/oauth-success', (req, res) => {
  res.json({
    success: true,
    message: 'OAuth authentication successful',
    redirect: process.env.CLIENT_URL || 'http://localhost:5173'
  });
});

module.exports = router;