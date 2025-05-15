const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');


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
  
      // Check password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
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

        const checkPasswordMatch = await bcrypt.compare(password, checkUser.password);
        if(!checkPasswordMatch) return res.json({
            success : false,
            message : "email or password incorrect"
        });

        // Sign a JWT token with extended expiration time for better UX
        const token = jwt.sign({
            id : checkUser._id, role : checkUser.role, email : checkUser.email, userName : checkUser.userName
        }, 'CLIENT_SECRET_KEY', {expiresIn : '24h'}); // Extended to 24 hours

        // Send token both in cookie (for server API calls) and in response (for localStorage)
        res.cookie('token', token, {
            httpOnly: false, // Allow JS access
            secure: process.env.NODE_ENV === 'production', // Use secure in production
            sameSite: 'lax', // Better compatibility with different browsers
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }).json({
            success : true,
            message : 'Logged in successfully',
            token: token, // Send token in response for localStorage storage
            user: {
                email : checkUser.email,
                role : checkUser.role,
                id : checkUser._id,
                userName : checkUser.userName
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
  const token = req.cookies.token;

  if(!token) return res.status(401).json({
    success : false,
    message : 'Unauthorized user!'
  });

  try {
    const decoded = jwt.verify(token, 'CLIENT_SECRET_KEY');
    req.user = decoded;
    next()
  } catch (error) {
    res.status(401).json({
      success : false,
    message : 'Unauthorized user!'
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







module.exports = {
    registerUser,
    loginUser,
    logoutUser, 
    authMiddleware,
    isSuperAdmin
};