const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User.js');
const emailService = require('../services/emailService.js');

// Security tracking - in production, use Redis or a proper database
const securityTracker = new Map();

// Helper function to safely track security events (production-safe)
const safeSecurityTracking = {
  track: (key, data) => {
    try {
      securityTracker.set(key, data);
    } catch (error) {
      console.error('Security tracking error:', error);
      // Continue without tracking in case of errors
    }
  },
  
  get: (key) => {
    try {
      return securityTracker.get(key);
    } catch (error) {
      console.error('Security tracking retrieval error:', error);
      return null;
    }
  },
  
  delete: (key) => {
    try {
      securityTracker.delete(key);
    } catch (error) {
      console.error('Security tracking deletion error:', error);
      // Continue without deleting in case of errors
    }
  },
  
  cleanup: () => {
    try {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      // Limit cleanup iterations to prevent blocking
      let cleanupCount = 0;
      for (const [k, v] of securityTracker.entries()) {
        if (cleanupCount > 100) break; // Prevent excessive cleanup
        if (v.lastAttempt < oneHourAgo) {
          securityTracker.delete(k);
          cleanupCount++;
        }
      }
    } catch (error) {
      console.error('Security tracking cleanup error:', error);
    }
  }
};

// Helper function to get client info
const getClientInfo = (req) => {
  try {
    return {
      ipAddress: req.ip || req.connection?.remoteAddress || 'Unknown',
      userAgent: req.get('User-Agent') || 'Unknown', 
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting client info:', error);
    return {
      ipAddress: 'Unknown',
      userAgent: 'Unknown',
      timestamp: new Date().toISOString()
    };
  }
};

// Helper function to track failed login attempts (production-safe)
const trackFailedLogin = (email, clientInfo) => {
  try {
    if (!email || !clientInfo) return { attempts: 1 };
    
    const key = `${email}_${clientInfo.ipAddress}`;
    const now = Date.now();
    
    const existing = safeSecurityTracking.get(key);
    if (!existing) {
      const newData = { attempts: 1, firstAttempt: now, lastAttempt: now };
      safeSecurityTracking.track(key, newData);
      return newData;
    } else {
      const updatedData = {
        ...existing,
        attempts: existing.attempts + 1,
        lastAttempt: now
      };
      safeSecurityTracking.track(key, updatedData);
      
      // Cleanup periodically (every 10 failed attempts)
      if (updatedData.attempts % 10 === 0) {
        safeSecurityTracking.cleanup();
      }
      
      return updatedData;
    }
  } catch (error) {
    console.error('Error tracking failed login:', error);
    return { attempts: 1 };
  }
};

// Helper function to check if IP is locked (production-safe)
const isIpLocked = (email, ipAddress) => {
  try {
    if (!email || !ipAddress) return false;
    
    const key = `${email}_${ipAddress}`;
    const data = safeSecurityTracking.get(key);
    
    if (!data) return false;
    
    const now = Date.now();
    const lockoutPeriod = 15 * 60 * 1000; // 15 minutes
    
    // Check if locked and lockout period hasn't expired
    if (data.attempts >= 5 && (now - data.lastAttempt) < lockoutPeriod) {
      return {
        locked: true,
        attempts: data.attempts,
        unlockTime: new Date(data.lastAttempt + lockoutPeriod),
        lockTime: new Date(data.lastAttempt)
      };
    }
    
    // Reset if lockout period expired
    if (data.attempts >= 5 && (now - data.lastAttempt) >= lockoutPeriod) {
      safeSecurityTracking.delete(key);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking IP lock status:', error);
    return false; // Default to unlocked if there's an error
  }
};

// register
const registerUser = async (req, res) => {
    const { userName, email, password } = req.body;
    
    try {
      // Validate input
      if (!userName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
        });
      }
  
      // Check email format
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
      }
  
      // Check password requirements
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters',
        });
      }
      
      // Check password pattern (uppercase, lowercase, number, special character)
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordPattern.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
        });
      }
  
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists',
        });
      }
  
      // Hash password
      const hashPassword = await bcrypt.hash(password, 12);
      
      // Create new user
      const newUser = new User({
        userName,
        email,
        password: hashPassword,
      });
  
      const savedUser = await newUser.save();
      console.log('✅ User registered successfully:', { email, userName, id: savedUser._id });

      // Send welcome email (enhanced with better error handling)
      try {
        console.log('📧 Attempting to send welcome email to:', email);
        
        // Verify email service is configured
        if (!emailService.transporter) {
          console.error('⚠️ Email service not configured - skipping welcome email');
        } else {
          await emailService.sendWelcomeEmail(email, userName);
          console.log('✅ Welcome email sent successfully to:', email);
        }
      } catch (emailError) {
        console.error('❌ Failed to send welcome email:', emailError);
        console.error('Email error details:', {
          name: emailError.name,
          message: emailError.message,
          code: emailError.code,
          command: emailError.command
        });
        // Continue with registration even if email fails
      }
  
      // Return success response (excluding password)
      res.status(201).json({
        success: true,
        message: 'Registration successful! Welcome email sent if email service is configured.',
      });
  
    } catch (error) {
      console.error('Error in registerUser:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };



// login
const loginUser = async(req, res) => {

    const {email, password} = req.body;

    try {
        const clientInfo = getClientInfo(req);
        
        // Check for account lockout
        const lockoutStatus = isIpLocked(email, clientInfo.ipAddress);
        if (lockoutStatus.locked) {
            // Send lockout notification email
            try {
                const user = await User.findOne({ email });
                if (user) {
                    await emailService.sendAccountLockoutEmail(user.email, user.userName, {
                        lockTime: lockoutStatus.lockTime,
                        attempts: lockoutStatus.attempts,
                        unlockTime: lockoutStatus.unlockTime,
                        ipAddress: clientInfo.ipAddress
                    });
                }
            } catch (emailError) {
                console.error('Failed to send lockout notification:', emailError);
            }
            
            return res.status(429).json({
                success: false,
                message: `Account temporarily locked due to multiple failed login attempts. Please try again after ${lockoutStatus.unlockTime.toLocaleTimeString()}.`,
                lockedUntil: lockoutStatus.unlockTime
            });
        }
        
        const checkUser = await User.findOne({ email });
        if(!checkUser) {
            // Track failed login attempt
            trackFailedLogin(email, clientInfo);
            return res.json({
                success : false,
                message : "User doesn't exists! Please register first"
            });
        }

        // Check if user is active
        if (!checkUser.isActive) {
            return res.json({
                success: false,
                message: "Account is deactivated. Please contact support."
            });
        }

        const checkPasswordMatch = await bcrypt.compare(password, checkUser.password);
        if(!checkPasswordMatch) {
            // Track failed login attempt
            const failedAttempts = trackFailedLogin(email, clientInfo);
            
            // Send security alert for multiple failed attempts
            if (failedAttempts.attempts >= 3) {
                try {
                    await emailService.sendSecurityAlertEmail(
                        checkUser.email,
                        checkUser.userName,
                        {
                            type: 'failed_login_attempts',
                            timestamp: clientInfo.timestamp,
                            ipAddress: clientInfo.ipAddress,
                            userAgent: clientInfo.userAgent,
                            location: 'Unknown' // Could integrate with IP geolocation service
                        }
                    );
                } catch (emailError) {
                    console.error('Failed to send security alert:', emailError);
                }
            }
            
            return res.json({
                success : false,
                message : "email or password incorrect"
            });
        }

        // Clear failed attempts on successful login
        const key = `${email}_${clientInfo.ipAddress}`;
        safeSecurityTracking.delete(key);

        // Check for new device login (simplified check)
        const isNewDevice = !checkUser.lastLogin || 
                          (checkUser.lastUserAgent && checkUser.lastUserAgent !== clientInfo.userAgent) ||
                          (checkUser.lastIpAddress && checkUser.lastIpAddress !== clientInfo.ipAddress);

        // Update last login and device info
        await User.findByIdAndUpdate(checkUser._id, { 
            lastLogin: new Date(),
            lastIpAddress: clientInfo.ipAddress,
            lastUserAgent: clientInfo.userAgent
        });

        // Send new device alert if applicable
        if (isNewDevice && checkUser.lastLogin) {
            try {
                await emailService.sendSecurityAlertEmail(
                    checkUser.email,
                    checkUser.userName,
                    {
                        type: 'new_device_login',
                        timestamp: clientInfo.timestamp,
                        ipAddress: clientInfo.ipAddress,
                        userAgent: clientInfo.userAgent,
                        location: 'Unknown'
                    }
                );
            } catch (emailError) {
                console.error('Failed to send new device alert:', emailError);
            }
        }

        // Get updated user data
        const updatedUser = await User.findById(checkUser._id);

        // Sign a JWT token with 1 hour expiration for better security
        const token = jwt.sign({
            id : checkUser._id, role : checkUser.role, email : checkUser.email, userName : checkUser.userName
        }, process.env.JWT_SECRET || 'CLIENT_SECRET_KEY', {expiresIn : '1h'}); // 1 hour expiration

        // Send token both in cookie (for server API calls) and in response (for localStorage)
        res.cookie('token', token, {
            httpOnly: false, // Allow JS access
            secure: process.env.NODE_ENV === 'production', // Use secure in production
            sameSite: 'lax', // Better compatibility with different browsers
            maxAge: 60 * 60 * 1000 // 1 hour - matches JWT expiration
        }).json({
            success : true,
            message : 'Logged in successfully',
            token: token, // Send token in response for localStorage storage
            user: {
                email: updatedUser.email,
                role: updatedUser.role,
                id: updatedUser._id,
                userName: updatedUser.userName,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                phone: updatedUser.phone,
                avatar: updatedUser.avatar,
                dateOfBirth: updatedUser.dateOfBirth,
                isActive: updatedUser.isActive,
                lastLogin: updatedUser.lastLogin,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt,
                shopName: updatedUser.shopName,
                baseRegion: updatedUser.baseRegion,
                baseCity: updatedUser.baseCity,
                balance: updatedUser.balance,
                totalEarnings: updatedUser.totalEarnings,
                shippingPreferences: updatedUser.shippingPreferences
            }
        });
        

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success : false,
            message : 'An error occured'
        })
    }
};




// logout
const logoutUser = (req, res) => {
  res.clearCookie('token').json({
    success : true,
    message : 'Logged out succesfully!'
  })
};


// auth Middleware
const authMiddleware = async(req, res, next) => {
  // Check for token in cookies first, then Authorization header
  let token = req.cookies.token;
  
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  if(!token) {
    console.log('AuthMiddleware: No token found in cookies or headers');
    return res.status(401).json({
      success : false,
      message : 'Unauthorized user!'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'CLIENT_SECRET_KEY');
    console.log('AuthMiddleware: Token verified successfully for user:', decoded.id);
    req.user = decoded;
    next()
  } catch (error) {
    console.log('AuthMiddleware: Token verification failed:', error.message);
    
    // Provide specific error messages for different token issues
    let message = 'Unauthorized user!';
    if (error.name === 'TokenExpiredError') {
      message = 'Token has expired. Please login again.';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token. Please login again.';
    }
    
    res.status(401).json({
      success : false,
      message : message,
      tokenExpired: error.name === 'TokenExpiredError'
    })
  }
}

// SuperAdmin middleware - checks if user has SuperAdmin role
const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'superAdmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. SuperAdmin privileges required.'
    });
  }

  next();
};

// Forgot Password - Send reset email
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // For security, we don't reveal whether email exists or not
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save token and expiration to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send password reset email with multiple domain support
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/auth/reset-password/${resetToken}`;
    
    try {
      await emailService.sendPasswordResetEmail(email, resetUrl, user.userName);
      console.log('Password reset email sent to:', email);
      
      res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email',
        // Include token for development/debugging
        resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
        token: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      
      // Clean up the reset token if email failed
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify Reset Token
const verifyResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reset token is valid'
    });

  } catch (error) {
    console.error('Error in verifyResetToken:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Validate input
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    // Check password pattern (uppercase, lowercase, number, special character)
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordPattern.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    console.log('Password reset successful for user:', user.email);

    // Send password changed security alert
    try {
      const clientInfo = getClientInfo(req);
      await emailService.sendSecurityAlertEmail(
        user.email,
        user.userName,
        {
          type: 'password_changed',
          timestamp: clientInfo.timestamp,
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          location: 'Unknown'
        }
      );
    } catch (emailError) {
      console.error('Failed to send password changed security alert:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};







module.exports = {
    registerUser,
    loginUser,
    logoutUser, 
    authMiddleware,
    isSuperAdmin,
    forgotPassword,
    verifyResetToken,
    resetPassword
};