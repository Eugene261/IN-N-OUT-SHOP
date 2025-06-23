const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User.js');
const emailService = require('../services/emailService.js');


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
  
      await newUser.save();
  
      // Send welcome email (optional - don't fail registration if email fails)
      try {
        await emailService.sendWelcomeEmail(email, userName);
        console.log('Welcome email sent to:', email);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Continue with registration even if email fails
      }
  
      // Return success response (excluding password)
      res.status(201).json({
        success: true,
        message: 'Registration successful',
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
        
        const checkUser = await User.findOne({ email });
        if(!checkUser) return res.json({
            success : false,
            message : "User doesn't exists! Please register first"
        });

        // Check if user is active
        if (!checkUser.isActive) {
            return res.json({
                success: false,
                message: "Account is deactivated. Please contact support."
            });
        }

        const checkPasswordMatch = await bcrypt.compare(password, checkUser.password);
        if(!checkPasswordMatch) return res.json({
            success : false,
            message : "email or password incorrect"
        });

        // Update last login
        await User.findByIdAndUpdate(checkUser._id, { lastLogin: new Date() });

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