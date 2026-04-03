const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        vehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        licenseDocument: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['Pending_License', 'Awaiting_Payment', 'Confirmed', 'Completed', 'Cancelled'],
            default: 'Pending_License',
        },
        paymentFlaggedForReview: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
