const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');

const VALID_TRANSITIONS = {
    Pending_License: ['Awaiting_Payment', 'Cancelled'],
    Awaiting_Payment: ['Confirmed', 'Cancelled'],
    Confirmed: ['Completed'],
    Completed: [],
    Cancelled: [],
};


const createBooking = async (req, res) => {
    try {
        const { vehicleId, startDate, endDate } = req.body;

        if (!vehicleId || !startDate || !endDate) {
            return res.status(400).json({ message: 'vehicleId, startDate, and endDate are required.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'License document is required.' });
        }

        // Validate vehicle exists, isActive, and Available
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle || !vehicle.isActive || vehicle.status !== 'Available') {
            return res.status(400).json({ message: 'Vehicle is not available for booking.' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const reqStart = new Date(startDate);
        const reqEnd = new Date(endDate);

        if (isNaN(reqStart.getTime()) || isNaN(reqEnd.getTime())) {
            return res.status(400).json({ message: 'Invalid date format.' });
        }

        if (reqStart < tomorrow) {
            return res.status(400).json({ message: 'Start date must be at least 1 day from today.' });
        }

        if (reqEnd <= reqStart) {
            return res.status(400).json({ message: 'End date must be strictly after start date.' });
        }

        const days = Math.ceil((reqEnd - reqStart) / (1000 * 60 * 60 * 24));
        if (days > 90) {
            return res.status(400).json({ message: 'Maximum rental duration is 90 days.' });
        }

        const conflict = await Booking.findOne({
            vehicleId,
            status: { $in: ['Awaiting_Payment', 'Confirmed'] },
            startDate: { $lt: reqEnd },
            endDate: { $gt: reqStart },
        });
        if (conflict) {
            return res.status(409).json({ message: 'Vehicle is unavailable for the selected dates.' });
        }

        // Compute total price 
        const totalPrice = parseFloat((vehicle.pricePerDay * days).toFixed(2));

        const booking = await Booking.create({
            userId: req.user._id,
            vehicleId,
            startDate: reqStart,
            endDate: reqEnd,
            totalPrice,
            licenseDocument: req.file.path.replace(/\\/g, '/'),
            status: 'Pending_License',
        });

        res.status(201).json({ message: 'Booking created. Awaiting license review.', booking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const getBookings = async (req, res) => {
    try {
        const { status, vehicleId, userId, startDate, endDate } = req.query;
        const filter = {};

        // Customers see only their own bookings
        if (req.user.role !== 'admin') {
            filter.userId = req.user._id;
        } else {
            if (userId) filter.userId = userId;
            if (vehicleId) filter.vehicleId = vehicleId;
            if (startDate || endDate) {
                filter.startDate = {};
                if (startDate) filter.startDate.$gte = new Date(startDate);
                if (endDate) filter.startDate.$lte = new Date(endDate);
            }
        }

        if (status) filter.status = status;

        const bookings = await Booking.find(filter)
            .populate('vehicleId', 'make model year licensePlate vehiclePhotos pricePerDay')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        const pendingLicense = req.user.role === 'admin'
            ? bookings.filter((b) => b.status === 'Pending_License').length
            : undefined;

        res.status(200).json({
            total: bookings.length,
            ...(req.user.role === 'admin' ? { pendingLicenseCount: pendingLicense } : {}),
            bookings,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('vehicleId', 'make model year licensePlate vehiclePhotos pricePerDay')
            .populate('userId', 'name email');

        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        if (req.user.role !== 'admin' && booking.userId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        res.status(200).json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) return res.status(400).json({ message: 'New status is required.' });

        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        const allowedNext = VALID_TRANSITIONS[booking.status] || [];
        if (!allowedNext.includes(status)) {
            return res.status(400).json({
                message: `Cannot transition from "${booking.status}" to "${status}". Invalid status transition.`,
            });
        }

        booking.status = status;
        await booking.save();

        res.status(200).json({ message: `Booking status updated to "${status}".`, booking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        if (!['Pending_License', 'Awaiting_Payment'].includes(booking.status)) {
            return res.status(400).json({
                message: `Cannot cancel a booking with status "${booking.status}". Only Pending_License or Awaiting_Payment bookings can be cancelled.`,
            });
        }

        const wasAwaitingPayment = booking.status === 'Awaiting_Payment';
        booking.status = 'Cancelled';

        if (wasAwaitingPayment) {
            booking.paymentFlaggedForReview = true;
        }

        await booking.save();

        res.status(200).json({
            message: 'Booking cancelled.' + (wasAwaitingPayment ? ' Payment flagged for admin review.' : ''),
            booking,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createBooking,
    getBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking,
};
