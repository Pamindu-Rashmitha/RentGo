const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');


const createPayment = async (req, res) => {
    try {
        const { bookingId, paymentMethod } = req.body;

        if (!bookingId || !paymentMethod) {
            return res.status(400).json({ message: 'bookingId and paymentMethod are required.' });
        }

        if (!['Card', 'Bank_Transfer'].includes(paymentMethod)) {
            return res.status(400).json({ message: 'paymentMethod must be one of: Card, Bank_Transfer.' });
        }

        // Validate booking exists, belongs to user, and is Awaiting_Payment
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });
        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }
        if (booking.status !== 'Awaiting_Payment') {
            return res.status(400).json({
                message: `Payment can only be initiated for bookings with status "Awaiting_Payment". Current status: "${booking.status}".`,
            });
        }

        // Check no duplicate payment exists
        const existingPayment = await Payment.findOne({ bookingId });
        if (existingPayment) {
            return res.status(400).json({ message: 'A payment record already exists for this booking.' });
        }

        // Bank Transfer requires receipt image
        if (paymentMethod === 'Bank_Transfer' && !req.file) {
            return res.status(400).json({ message: 'Receipt image is required for Bank Transfer payments.' });
        }

        // Bank Transfer path 
        if (paymentMethod === 'Bank_Transfer') {
            const payment = await Payment.create({
                bookingId,
                userId: req.user._id,
                amount: booking.totalPrice,
                paymentMethod,
                receiptImage: req.file.path.replace(/\\/g, '/'),
                status: 'Payment_Under_Review',
            });
            return res.status(201).json({
                message: 'Payment submitted. Awaiting admin verification.',
                payment,
            });
        }

        // Card path 
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const payment = await Payment.create([{
                bookingId,
                userId: req.user._id,
                amount: booking.totalPrice,
                paymentMethod: 'Card',
                status: 'Paid',
            }], { session });

            booking.status = 'Confirmed';
            await booking.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.status(201).json({
                message: 'Payment successful. Booking is now Confirmed.',
                payment: payment[0],
            });
        } catch (txError) {
            await session.abortTransaction();
            session.endSession();
            throw txError;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const getPayments = async (req, res) => {
    try {
        const filter = {};

        if (req.user.role !== 'admin') {
            filter.userId = req.user._id;
        }

        const payments = await Payment.find(filter)
            .populate({
                path: 'bookingId',
                populate: { path: 'vehicleId', select: 'make model year licensePlate vehiclePhoto' },
            })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        const underReviewCount = req.user.role === 'admin'
            ? payments.filter((p) => p.status === 'Payment_Under_Review').length
            : undefined;

        res.status(200).json({
            total: payments.length,
            ...(req.user.role === 'admin' ? { underReviewCount } : {}),
            payments,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const verifyPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found.' });

        if (payment.status !== 'Payment_Under_Review') {
            return res.status(400).json({
                message: `Cannot verify a payment with status "${payment.status}". Must be "Payment_Under_Review".`,
            });
        }

        const booking = await Booking.findById(payment.bookingId);
        if (!booking) return res.status(404).json({ message: 'Linked booking not found.' });

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            payment.status = 'Paid';
            await payment.save({ session });

            booking.status = 'Confirmed';
            await booking.save({ session });

            await session.commitTransaction();
            session.endSession();

            res.status(200).json({ message: 'Payment verified. Booking is now Confirmed.', payment });
        } catch (txError) {
            await session.abortTransaction();
            session.endSession();
            throw txError;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const voidPayment = async (req, res) => {
    try {
        const { voidReason } = req.body;

        if (!voidReason || voidReason.trim().length < 10 || voidReason.trim().length > 255) {
            return res.status(400).json({
                message: 'voidReason is required and must be between 10 and 255 characters.',
            });
        }

        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found.' });

        if (payment.status === 'Voided') {
            return res.status(400).json({ message: 'Payment is already voided.' });
        }
        if (payment.status === 'Paid') {
            return res.status(400).json({ message: 'Cannot void an already Paid payment.' });
        }

        payment.status = 'Voided';
        payment.voidReason = voidReason.trim();
        await payment.save();


        const booking = await Booking.findById(payment.bookingId);
        if (booking && booking.status === 'Awaiting_Payment') {
            booking.status = 'Cancelled';
            await booking.save();
        }

        res.status(200).json({
            message: 'Payment voided. Linked booking set to Cancelled.',
            payment,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createPayment,
    getPayments,
    verifyPayment,
    voidPayment,
};
