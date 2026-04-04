const express = require('express');
const router = express.Router();
const {
    createTicket,
    getTickets,
    getVehicleTickets,
    updateTicket,
    deleteTicket,
} = require('../controllers/maintenanceController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { uploadDamagePhotos } = require('../middleware/uploadMiddleware');

router.post('/', protect, adminOnly, uploadDamagePhotos, createTicket);
router.get('/', protect, adminOnly, getTickets);
router.get('/vehicle/:vehicleId', protect, adminOnly, getVehicleTickets);
router.patch('/:id', protect, adminOnly, updateTicket);
router.delete('/:id', protect, adminOnly, deleteTicket);

module.exports = router;
