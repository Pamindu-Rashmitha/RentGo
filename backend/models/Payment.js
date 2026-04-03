const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
            unique: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: ['Card', 'Bank_Transfer'],
        },
        receiptImage: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ['Payment_Under_Review', 'Paid', 'Voided'],
            default: 'Payment_Under_Review',
        },
        voidReason: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
