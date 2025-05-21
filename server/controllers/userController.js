const User = require('../models/User');

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
                    defaultBaseRate: 40,
                    defaultOutOfRegionRate: 70,
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
    updateUserSettings,
    updateBaseRegion,
    getBaseRegion,
    getVendorShippingSettings
};