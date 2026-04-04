const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');



const recalculateRating = async (vehicleId) => {
    const reviews = await Review.find({ vehicleId });
    if (reviews.length === 0) {
        await Vehicle.findByIdAndUpdate(vehicleId, { averageRating: null });
    } else {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await Vehicle.findByIdAndUpdate(vehicleId, {
            averageRating: parseFloat(avg.toFixed(1)),
        });
    }
};



const createReview = async (req, res) => {
    try {
        const { vehicleId, rating, comment } = req.body;

        if (!vehicleId || rating === undefined || !comment) {
            return res.status(400).json({ message: 'vehicleId, rating, and comment are required.' });
        }

        const completedBooking = await Booking.findOne({
            userId: req.user._id,
            vehicleId,
            status: 'Completed',
        });
        if (!completedBooking) {
            return res.status(403).json({
                message: 'You can only review a vehicle after completing a rental.',
            });
        }

        // Duplicate check
        const existingReview = await Review.findOne({ userId: req.user._id, vehicleId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this vehicle.' });
        }

        // Validate vehicle exists and is active
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle || !vehicle.isActive) {
            return res.status(404).json({ message: 'Vehicle not found.' });
        }

        // Validate rating
        const ratingInt = parseInt(rating, 10);
        if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5 || String(rating).includes('.')) {
            return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
        }

        // Validate comment
        const trimmedComment = String(comment).trim();
        if (trimmedComment.length < 10 || trimmedComment.length > 500) {
            return res.status(400).json({ message: 'Comment must be between 10 and 500 characters.' });
        }

        const review = await Review.create({
            userId: req.user._id,
            vehicleId,
            rating: ratingInt,
            comment: trimmedComment,
        });

        await recalculateRating(vehicleId);

        res.status(201).json({ message: 'Review submitted successfully.', review });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this vehicle.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const getVehicleReviews = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const vehicle = await Vehicle.findById(vehicleId).select('averageRating make model');
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });

        const total = await Review.countDocuments({ vehicleId });
        const reviews = await Review.find({ vehicleId })
            .populate('userId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const sanitized = reviews.map((r) => {
            const nameParts = r.userId.name.trim().split(' ');
            const firstName = nameParts[0];
            const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] + '.' : '';
            return {
                _id: r._id,
                userId: r.userId._id,
                author: `${firstName}${lastInitial ? ' ' + lastInitial : ''}`,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt,
            };
        });

        res.status(200).json({
            vehicleId,
            averageRating: vehicle.averageRating,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            reviews: sanitized,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const updateReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found.' });

        if (review.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only edit your own reviews.' });
        }

        const { rating, comment } = req.body;

        if (rating !== undefined) {
            const ratingInt = parseInt(rating, 10);
            if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5 || String(rating).includes('.')) {
                return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
            }
            review.rating = ratingInt;
        }

        if (comment !== undefined) {
            const trimmedComment = String(comment).trim();
            if (trimmedComment.length < 10 || trimmedComment.length > 500) {
                return res.status(400).json({ message: 'Comment must be between 10 and 500 characters.' });
            }
            review.comment = trimmedComment;
        }

        await review.save();
        await recalculateRating(review.vehicleId);

        res.status(200).json({ message: 'Review updated successfully.', review });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found.' });

        const isAdmin = req.user.role === 'admin';
        const isOwner = review.userId.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'You can only delete your own reviews.' });
        }

        const vehicleId = review.vehicleId;
        await Review.findByIdAndDelete(req.params.id);
        await recalculateRating(vehicleId);

        res.status(200).json({ message: 'Review deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createReview,
    getVehicleReviews,
    updateReview,
    deleteReview,
};
