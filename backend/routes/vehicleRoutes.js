const express = require('express');
const router = express.Router();
const {
    createVehicle,
    getVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { uploadVehiclePhoto } = require('../middleware/uploadMiddleware');
const { optionalProtect } = require('../middleware/optionalAuth');

// Public
router.get('/', optionalProtect, getVehicles);
router.get('/:id', getVehicleById);

// Admin only
router.post('/', protect, adminOnly, uploadVehiclePhoto, createVehicle);
router.put('/:id', protect, adminOnly, uploadVehiclePhoto, updateVehicle);
router.delete('/:id', protect, adminOnly, deleteVehicle);

module.exports = router;
