const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
    {
        vehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: true,
        },
        ticketTitle: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 100,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 1000,
        },
        maintenanceType: {
            type: String,
            required: true,
            enum: ['Routine_Service', 'Damage_Repair', 'Inspection', 'Other'],
        },
        scheduledDate: {
            type: Date,
            required: true,
        },
        damagePhotos: {
            type: [String],
            default: [],
        },
        status: {
            type: String,
            enum: ['Open', 'In_Progress', 'Completed', 'Cancelled'],
            default: 'Open',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Maintenance', maintenanceSchema);
