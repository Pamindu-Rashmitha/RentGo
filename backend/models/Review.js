const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
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
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 500,
        },
    },
    { timestamps: true }
);

reviewSchema.index({ userId: 1, vehicleId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
