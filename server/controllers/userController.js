const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        
        // Check permissions
        if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to access this profile'
            });
        }
        
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        console.log('getUserProfile - Retrieved user data:', {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            baseRegion: user.baseRegion,
            baseCity: user.baseCity,
            shopName: user.shopName,
            role: user.role
        });
        
        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        console.log('=== UPDATE PROFILE BACKEND ===');
        console.log('Request user:', req.user);
        console.log('Request body:', req.body);
        console.log('Request params:', req.params);
        
        const userId = req.params.userId || req.user.id;
        const { 
            firstName, 
            lastName, 
            phone, 
            dateOfBirth, 
            avatar,
            shopName,
            userName,
            baseRegion,
            baseCity
        } = req.body;
        
        console.log('Using userId:', userId);
        
        // Check permissions
        if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
            console.log('Permission denied for user:', req.user.id, 'trying to update:', userId);
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this profile'
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check if userName is being changed and if it's unique
        if (userName && userName !== user.userName) {
            const existingUser = await User.findOne({ userName, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }
            user.userName = userName;
        }
        
        // Update profile fields
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (phone !== undefined) user.phone = phone;
        if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
        if (avatar !== undefined) user.avatar = avatar;
        if (shopName !== undefined) user.shopName = shopName;
        if (baseRegion !== undefined) user.baseRegion = baseRegion;
        if (baseCity !== undefined) user.baseCity = baseCity;
        
        await user.save();
        console.log('User saved successfully to database');
        
        // Return updated user without password
        const updatedUser = await User.findById(userId).select('-password');
        console.log('Retrieved updated user from database:', {
            id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            phone: updatedUser.phone,
            baseRegion: updatedUser.baseRegion,
            baseCity: updatedUser.baseCity,
            shopName: updatedUser.shopName
        });
        
        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        console.log('=== CHANGE PASSWORD REQUEST ===');
        console.log('Request user:', req.user);
        console.log('Request body:', { currentPassword: '***', newPassword: '***' });
        console.log('Request params:', req.params);
        
        const userId = req.params.userId || req.user.id;
        const { currentPassword, newPassword } = req.body;
        
        console.log('Using userId:', userId);
        
        // Check permissions
        if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
            console.log('Permission denied for user:', req.user.id, 'trying to change password for:', userId);
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to change this password'
            });
        }
        
        // Validate input
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters long'
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
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check current password (only for users changing their own password)
        if (req.user.id === userId && currentPassword) {
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }
        }
        
        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedNewPassword;
        
        await user.save();
        
        return res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get all users (Admin and SuperAdmin only)
const getAllUsers = async (req, res) => {
    try {
        // Check if user is admin or superAdmin
        if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const role = req.query.role || '';
        
        // Build search query
        let query = {};
        if (search) {
            query = {
                $or: [
                    { userName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } }
                ]
            };
        }
        if (role) {
            query.role = role;
        }
        
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalUsers = await User.countDocuments(query);
        
        return res.status(200).json({
            success: true,
            data: users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers,
                hasNext: page < Math.ceil(totalUsers / limit),
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Update user role (SuperAdmin only)
const updateUserRole = async (req, res) => {
    try {
        // Check if user is superAdmin
        if (req.user.role !== 'superAdmin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. SuperAdmin privileges required.'
            });
        }
        
        const { userId } = req.params;
        const { role } = req.body;
        
        if (!['user', 'admin', 'superAdmin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Prevent superAdmin from demoting themselves
        if (userId === req.user.id && role !== 'superAdmin') {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own role'
            });
        }
        
        user.role = role;
        await user.save();
        
        return res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            data: { userId, role }
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Toggle user active status (Admin and SuperAdmin only)
const toggleUserStatus = async (req, res) => {
    try {
        // Check if user is admin or superAdmin
        if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
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
        
        // Prevent admin/superAdmin from deactivating themselves
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own status'
            });
        }
        
        user.isActive = !user.isActive;
        await user.save();
        
        return res.status(200).json({
            success: true,
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            data: { userId, isActive: user.isActive }
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Delete user (SuperAdmin only)
const deleteUser = async (req, res) => {
    try {
        // Check if user is superAdmin
        if (req.user.role !== 'superAdmin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. SuperAdmin privileges required.'
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
        
        // Prevent superAdmin from deleting themselves
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }
        
        await User.findByIdAndDelete(userId);
        
        return res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Update user settings
const updateUserSettings = async (req, res) => {
    try {
        const { userId } = req.params;
        const { 
            timezone, 
            baseRegion, 
            baseCity, 
            shippingPreferences 
        } = req.body;
        
        // Only allow users to update their own settings or admin/superAdmin to update any user
        if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this user\'s settings'
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Update timezone
        if (timezone) {
            user.timezone = timezone;
        }
        
        // Update shipping-related fields
        if (baseRegion !== undefined) {
            user.baseRegion = baseRegion;
            console.log(`Updated base region to: ${baseRegion}`);
        }
        
        if (baseCity !== undefined) {
            user.baseCity = baseCity;
            console.log(`Updated base city to: ${baseCity}`);
        }
        
        // Update shipping preferences
        if (shippingPreferences) {
            // Initialize shippingPreferences if it doesn't exist
            if (!user.shippingPreferences) {
                user.shippingPreferences = {};
            }
            
            // Update default base rate
            if (shippingPreferences.defaultBaseRate !== undefined) {
                user.shippingPreferences.defaultBaseRate = parseFloat(shippingPreferences.defaultBaseRate);
            }
            
            // Update default out-of-region rate
            if (shippingPreferences.defaultOutOfRegionRate !== undefined) {
                user.shippingPreferences.defaultOutOfRegionRate = parseFloat(shippingPreferences.defaultOutOfRegionRate);
            }
            
            // Update regional rates flag
            if (shippingPreferences.enableRegionalRates !== undefined) {
                user.shippingPreferences.enableRegionalRates = shippingPreferences.enableRegionalRates;
            }
            
            console.log('Updated shipping preferences:', JSON.stringify(user.shippingPreferences));
        }
        
        await user.save();
        
        return res.status(200).json({
            success: true,
            message: 'User settings updated successfully',
            data: {
                baseRegion: user.baseRegion,
                baseCity: user.baseCity,
                shippingPreferences: user.shippingPreferences,
                timezone: user.timezone
            }
        });
    } catch (error) {
        console.error('Error updating user settings:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Update base region
const updateBaseRegion = async (req, res) => {
    try {
        const { baseRegion } = req.body;
        const userId = req.user.id;
        
        if (!baseRegion) {
            return res.status(400).json({
                success: false,
                message: 'Base region is required'
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Update base region
        user.baseRegion = baseRegion;
        await user.save();
        
        return res.status(200).json({
            success: true,
            message: 'Base region updated successfully',
            baseRegion: user.baseRegion
        });
    } catch (error) {
        console.error('Error updating base region:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get base region
const getBaseRegion = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            baseRegion: user.baseRegion || ''
        });
    } catch (error) {
        console.error('Error fetching base region:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get vendor shipping settings
const getVendorShippingSettings = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        
        // Check permissions for accessing other users' data
        if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to access this user\'s settings'
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: {
                baseRegion: user.baseRegion || '',
                baseCity: user.baseCity || '',
                shippingPreferences: user.shippingPreferences || {
                    defaultBaseRate: 0,
                    enableRegionalRates: true
                }
            }
        });
    } catch (error) {
        console.error('Error fetching vendor shipping settings:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    changePassword,
    getAllUsers,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    updateUserSettings,
    updateBaseRegion,
    getBaseRegion,
    getVendorShippingSettings
};