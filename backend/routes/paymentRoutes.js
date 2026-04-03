const express = require('express');
const router = express.Router();
const {
    createPayment,
    getPayments,
    verifyPayment,
    voidPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { uploadReceiptImage } = require('../middleware/uploadMiddleware');

router.post('/', protect, uploadReceiptImage, createPayment);
router.get('/', protect, getPayments);
router.patch('/:id/verify', protect, adminOnly, verifyPayment);
router.patch('/:id/void', protect, adminOnly, voidPayment);

module.exports = router;
