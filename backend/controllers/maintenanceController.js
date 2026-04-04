const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');


const VALID_TRANSITIONS = {
    Open: ['In_Progress', 'Cancelled'],
    In_Progress: ['Completed'],
    Completed: [],
    Cancelled: [],
};


const EDITABLE_STATUSES = ['Open'];


const createTicket = async (req, res) => {
    try {
        const { vehicleId, ticketTitle, description, maintenanceType, scheduledDate } = req.body;

        // Required field checks
        if (!vehicleId || !ticketTitle || !description || !maintenanceType || !scheduledDate) {
            return res.status(400).json({
                message: 'vehicleId, ticketTitle, description, maintenanceType, and scheduledDate are all required.',
            });
        }

        // Vehicle must exist and be active
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle || !vehicle.isActive) {
            return res.status(404).json({ message: 'Vehicle not found or inactive.' });
        }

        const validTypes = ['Routine_Service', 'Damage_Repair', 'Inspection', 'Other'];
        if (!validTypes.includes(maintenanceType)) {
            return res.status(400).json({
                message: `maintenanceType must be one of: ${validTypes.join(', ')}.`,
            });
        }

        if (ticketTitle.trim().length < 5 || ticketTitle.trim().length > 100) {
            return res.status(400).json({ message: 'ticketTitle must be between 5 and 100 characters.' });
        }
        if (description.trim().length < 10 || description.trim().length > 1000) {
            return res.status(400).json({ message: 'description must be between 10 and 1000 characters.' });
        }

        const schedDate = new Date(scheduledDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isNaN(schedDate.getTime()) || schedDate < today) {
            return res.status(400).json({ message: 'scheduledDate must not be in the past.' });
        }

        // check if it overlaps any confirmed booking
        const conflict = await Booking.findOne({
            vehicleId,
            status: 'Confirmed',
            startDate: { $lte: schedDate },
            endDate: { $gte: schedDate },
        });
        if (conflict) {
            return res.status(409).json({
                message:
                    'Vehicle has an active confirmed booking during this period. Resolve the booking before scheduling maintenance.',
            });
        }

        // Collect damage photo paths and validate count
        if (req.files && req.files.length > 5) {
            return res.status(400).json({ message: 'Maximum 5 damage photos allowed.' });
        }
        const damagePhotos = req.files
            ? req.files.map((f) => f.path.replace(/\\/g, '/'))
            : [];

        // Create ticket
        const ticket = await Maintenance.create({
            vehicleId,
            ticketTitle: ticketTitle.trim(),
            description: description.trim(),
            maintenanceType,
            scheduledDate: schedDate,
            damagePhotos,
            status: 'Open',
        });

        // Automatically set vehicle to Under_Maintenance
        vehicle.status = 'Under_Maintenance';
        await vehicle.save();

        res.status(201).json({
            message: 'Maintenance ticket created. Vehicle status set to Under_Maintenance.',
            ticket,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const getTickets = async (req, res) => {
    try {
        const { maintenanceType, status } = req.query;
        const filter = {};

        if (maintenanceType) filter.maintenanceType = maintenanceType;
        if (status) filter.status = status;

        const tickets = await Maintenance.find(filter)
            .populate('vehicleId', 'make model year licensePlate status')
            .sort({ createdAt: -1 });

        // Count vehicles currently under maintenance
        const underMaintenanceCount = await Vehicle.countDocuments({ status: 'Under_Maintenance', isActive: true });

        res.status(200).json({ total: tickets.length, underMaintenanceCount, tickets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const getVehicleTickets = async (req, res) => {
    try {
        const { vehicleId } = req.params;

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });

        const tickets = await Maintenance.find({ vehicleId }).sort({ createdAt: -1 });
        res.status(200).json({ total: tickets.length, vehicle, tickets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const updateTicket = async (req, res) => {
    try {
        const ticket = await Maintenance.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Maintenance ticket not found.' });

        const { status, ticketTitle, description, maintenanceType, scheduledDate } = req.body;

        if (status) {
            const allowedNext = VALID_TRANSITIONS[ticket.status] || [];
            if (!allowedNext.includes(status)) {
                return res.status(400).json({
                    message: `Cannot transition from "${ticket.status}" to "${status}". Invalid transition.`,
                });
            }
        }

        if (!EDITABLE_STATUSES.includes(ticket.status)) {
            if (ticketTitle || description || maintenanceType || scheduledDate) {
                return res.status(400).json({
                    message: 'Ticket fields can only be edited while the ticket is in Open status.',
                });
            }
        }

        if (EDITABLE_STATUSES.includes(ticket.status)) {
            if (ticketTitle) {
                if (ticketTitle.trim().length < 5 || ticketTitle.trim().length > 100) {
                    return res.status(400).json({ message: 'ticketTitle must be between 5 and 100 characters.' });
                }
                ticket.ticketTitle = ticketTitle.trim();
            }
            if (description) {
                if (description.trim().length < 10 || description.trim().length > 1000) {
                    return res.status(400).json({ message: 'description must be between 10 and 1000 characters.' });
                }
                ticket.description = description.trim();
            }
            if (maintenanceType) {
                const validTypes = ['Routine_Service', 'Damage_Repair', 'Inspection', 'Other'];
                if (!validTypes.includes(maintenanceType)) {
                    return res.status(400).json({ message: `maintenanceType must be one of: ${validTypes.join(', ')}.` });
                }
                ticket.maintenanceType = maintenanceType;
            }
            if (scheduledDate) {
                const schedDate = new Date(scheduledDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (isNaN(schedDate.getTime()) || schedDate < today) {
                    return res.status(400).json({ message: 'scheduledDate must not be in the past.' });
                }
                ticket.scheduledDate = schedDate;
            }
        }

        if (status) {
            ticket.status = status;

            if (status === 'Completed') {
                await Vehicle.findByIdAndUpdate(ticket.vehicleId, { status: 'Available' });
            }
        }

        await ticket.save();
        res.status(200).json({
            message: `Ticket updated${status ? ` — status now "${status}"` : ''}.`,
            ticket,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteTicket = async (req, res) => {
    try {
        const ticket = await Maintenance.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Maintenance ticket not found.' });

        if (ticket.status === 'In_Progress') {
            return res.status(400).json({
                message: 'Cannot delete a ticket in progress. Complete or cancel it first.',
            });
        }

        if (ticket.status === 'Completed' || ticket.status === 'Cancelled') {
            return res.status(400).json({
                message: 'Audit trail must be preserved. Completed or Cancelled tickets cannot be deleted.',
            });
        }

        // If Open, allow deletion and restore vehicle status
        if (ticket.status === 'Open') {
            const vehicle = await Vehicle.findById(ticket.vehicleId);
            if (vehicle && vehicle.status === 'Under_Maintenance') {
                vehicle.status = 'Available';
                await vehicle.save();
            }
            await Maintenance.findByIdAndDelete(req.params.id);
            return res.status(200).json({
                message: 'Ticket deleted and vehicle status restored to Available.',
            });
        }

        res.status(400).json({ message: 'Invalid ticket status for deletion.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createTicket,
    getTickets,
    getVehicleTickets,
    updateTicket,
    deleteTicket,
};
