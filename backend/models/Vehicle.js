const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
    {
        make: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50,
        },
        model: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50,
        },
        year: {
            type: Number,
            required: true,
        },
        licensePlate: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        pricePerDay: {
            type: Number,
            required: true,
        },
        fuelType: {
            type: String,
            required: true,
            enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
        },
        transmission: {
            type: String,
            required: true,
            enum: ['Manual', 'Automatic'],
        },
        seatingCapacity: {
            type: Number,
            required: true,
        },
        vehiclePhotos: {
            type: [String],
            required: true,
        },
        status: {
            type: String,
            enum: ['Available', 'Under_Maintenance'],
            default: 'Available',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        averageRating: {
            type: Number,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
