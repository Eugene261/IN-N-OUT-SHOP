const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../controllers/authController.js');
const { 
  getAllUsers, 
  getUsersByRole, 
  addUser, 
  updateUserRole, 
  deleteUser,
  getAdminProfile 
} = require('../../controllers/superAdmin/userController.js');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all users
router.get('/all', getAllUsers);

// Get users by role
router.get('/role/:role', getUsersByRole);

// Add a new user
router.post('/add', addUser);

// Update user role
router.put('/update-role/:userId', updateUserRole);

// Delete a user
router.delete('/delete/:userId', deleteUser);

// Get detailed admin profile
router.get('/profile/:adminId', getAdminProfile);

module.exports = router;
