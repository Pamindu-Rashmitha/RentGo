const express = require('express');
const router = express.Router();
const {
    createBooking,
    getBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { uploadLicenseDocument } = require('../middleware/uploadMiddleware');

router.post('/', protect, uploadLicenseDocument, createBooking);
router.get('/', protect, getBookings);
router.get('/:id', protect, getBookingById);
router.patch('/:id/status', protect, adminOnly, updateBookingStatus);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;
