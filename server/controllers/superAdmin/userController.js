const User = require('../../models/User.js');const bcrypt = require('bcryptjs');const emailService = require('../../services/emailService.js');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }

    const users = await User.find({}, { password: 0 }); // Exclude password field
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get users by role
const getUsersByRole = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }

    const { role } = req.params;
    
    if (!['user', 'admin', 'superAdmin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    const users = await User.find({ role }, { password: 0 }); // Exclude password field
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error in getUsersByRole:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add a new user (admin or superAdmin)
const addUser = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can add users.'
      });
    }

    const { userName, email, password, role } = req.body;
    
    // Validate input
    if (!userName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate role
    if (!['admin', 'superAdmin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Only admin or superAdmin roles can be created.'
      });
    }

    // Check email format
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 12);
    
    // Create new user
    const newUser = new User({
      userName,
      email,
      password: hashPassword,
      role
    });

        await newUser.save();        // Send welcome email with credentials for admin users    if (role === 'admin') {      try {        await emailService.sendNewAdminWelcomeEmail(          email,          userName,          password // Send the original password since it's temporary        );        console.log('Welcome email sent to new admin:', email);      } catch (emailError) {        console.error('Failed to send welcome email to new admin:', emailError);        // Don't fail the user creation if email fails      }    }    res.status(201).json({      success: true,      message: 'User created successfully',      user: {        id: newUser._id,        userName: newUser.userName,        email: newUser.email,        role: newUser.role      }    });
  } catch (error) {
    console.error('Error in addUser:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can update user roles.'
      });
    }

    const { userId } = req.params;
    const { role } = req.body;
    
    // Validate role
    if (!['user', 'admin', 'superAdmin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can delete users.'
      });
    }

    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllUsers,
  getUsersByRole,
  addUser,
  updateUserRole,
  deleteUser
};
