const express = require('express');
const router = express.Router();
const { getUsers, deleteUser, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Get all users 
router.get('/', protect, adminOnly, getUsers);

// Delete user 
router.delete('/:id', protect, adminOnly, deleteUser);

// Update own profile
router.put('/profile', protect, updateProfile);

module.exports = router;
