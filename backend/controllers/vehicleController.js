const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');


const CURRENT_YEAR = new Date().getFullYear();
const LICENSE_PLATE_REGEX = /^[A-Z]{2,3}-\d{4}$/;
const VALID_FUEL = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const VALID_TRANSMISSION = ['Manual', 'Automatic'];

const validateVehicleFields = (body, files, isCreate) => {
    const errors = [];
    const {
        make, model, year, licensePlate, pricePerDay,
        fuelType, transmission, seatingCapacity,
    } = body;

    if (isCreate || make !== undefined) {
        if (!make || make.trim().length < 2 || make.trim().length > 10)
            errors.push('Make must be 2–10 characters.');
        else if (!/^[A-Za-z\s]+$/.test(make.trim()))
            errors.push('Make must contain letters only (no numbers or special characters).');
    }

    if (isCreate || model !== undefined) {
        if (!model || model.trim().length < 2 || model.trim().length > 15)
            errors.push('Model must be 2–15 characters.');
        else if (!/^[A-Za-z0-9\s]+$/.test(model.trim()))
            errors.push('Model must be alphanumeric.');
    }

    if (isCreate || year !== undefined) {
        const y = parseInt(year, 10);
        if (isNaN(y) || y < 1990 || y > CURRENT_YEAR)
            errors.push(`Year must be between 1990 and ${CURRENT_YEAR}.`);
    }

    if (isCreate || licensePlate !== undefined) {
        const plate = (licensePlate || '').toUpperCase().trim();
        if (!LICENSE_PLATE_REGEX.test(plate))
            errors.push('License plate must match format AB-1234 (2–3 uppercase letters, dash, 4 digits).');
    }

    if (isCreate || pricePerDay !== undefined) {
        const price = parseFloat(pricePerDay);
        if (isNaN(price) || price < 1 || price > 10000)
            errors.push('Price per day must be between $1.00 and $10,000.00.');
        else if (!/^\d+(\.\d{1,2})?$/.test(String(pricePerDay)))
            errors.push('Price per day must have at most 2 decimal places.');
    }

    if (isCreate || fuelType !== undefined) {
        if (!VALID_FUEL.includes(fuelType))
            errors.push(`Fuel type must be one of: ${VALID_FUEL.join(', ')}.`);
    }

    if (isCreate || transmission !== undefined) {
        if (!VALID_TRANSMISSION.includes(transmission))
            errors.push(`Transmission must be one of: ${VALID_TRANSMISSION.join(', ')}.`);
    }

    if (isCreate || seatingCapacity !== undefined) {
        const seats = parseInt(seatingCapacity, 10);
        if (isNaN(seats) || seats < 1 || seats > 15)
            errors.push('Seating capacity must be between 1 and 15.');
    }

    if (isCreate && (!files || files.length === 0)) {
        errors.push('At least one vehicle photo is required.');
    }

    return errors;
};


const createVehicle = async (req, res) => {
    try {
        const errors = validateVehicleFields(req.body, req.files, true);
        if (errors.length > 0) return res.status(400).json({ message: errors[0], errors });

        const plate = req.body.licensePlate.toUpperCase().trim();
        const existing = await Vehicle.findOne({ licensePlate: plate });
        if (existing) return res.status(400).json({ message: 'License plate already exists in the database.' });

        const vehicle = await Vehicle.create({
            make: req.body.make.trim(),
            model: req.body.model.trim(),
            year: parseInt(req.body.year, 10),
            licensePlate: plate,
            pricePerDay: parseFloat(req.body.pricePerDay),
            fuelType: req.body.fuelType,
            transmission: req.body.transmission,
            seatingCapacity: parseInt(req.body.seatingCapacity, 10),
            vehiclePhotos: req.files.map(f => f.path.replace(/\\/g, '/')),
            isActive: true,
            status: 'Available',
        });

        res.status(201).json({ message: 'Vehicle created successfully.', vehicle });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const getVehicles = async (req, res) => {
    try {
        const {
            fuelType, transmission, seatingCapacity,
            minPrice, maxPrice, startDate, endDate,
        } = req.query;

        const filter = { isActive: true, status: 'Available' };

        if (fuelType && VALID_FUEL.includes(fuelType)) filter.fuelType = fuelType;
        if (transmission && VALID_TRANSMISSION.includes(transmission)) filter.transmission = transmission;
        if (seatingCapacity) filter.seatingCapacity = parseInt(seatingCapacity, 10);
        if (minPrice || maxPrice) {
            filter.pricePerDay = {};
            if (minPrice) filter.pricePerDay.$gte = parseFloat(minPrice);
            if (maxPrice) filter.pricePerDay.$lte = parseFloat(maxPrice);
        }

        let excludedVehicleIds = [];
        if (startDate && endDate) {
            const reqStart = new Date(startDate);
            const reqEnd = new Date(endDate);

            if (reqStart < reqEnd) {
                const conflicts = await Booking.find({
                    status: { $in: ['Awaiting_Payment', 'Confirmed'] },
                    startDate: { $lt: reqEnd },
                    endDate: { $gt: reqStart },
                }).select('vehicleId');

                excludedVehicleIds = conflicts.map((b) => b.vehicleId.toString());
            }
        }

        if (excludedVehicleIds.length > 0) {
            filter._id = { $nin: excludedVehicleIds };
        }

        const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
        res.status(200).json(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const getVehicleById = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });
        res.status(200).json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const updateVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });

        const errors = validateVehicleFields(req.body, req.files, false);
        if (errors.length > 0) return res.status(400).json({ message: errors[0], errors });

        if (req.body.status === 'Under_Maintenance') {
            const confirmedBooking = await Booking.findOne({
                vehicleId: vehicle._id,
                status: 'Confirmed',
            });
            if (confirmedBooking) {
                return res.status(409).json({
                    message: 'Vehicle has an active confirmed booking. Cannot be set to maintenance.',
                });
            }
        }

        if (req.body.licensePlate) {
            const plate = req.body.licensePlate.toUpperCase().trim();
            if (plate !== vehicle.licensePlate) {
                const existing = await Vehicle.findOne({ licensePlate: plate });
                if (existing) {
                    return res.status(400).json({ message: 'License plate already exists in the database.' });
                }
            }
            vehicle.licensePlate = req.body.licensePlate.toUpperCase().trim();
        }

        if (req.body.make) vehicle.make = req.body.make.trim();
        if (req.body.model) vehicle.model = req.body.model.trim();
        if (req.body.year) vehicle.year = parseInt(req.body.year, 10);
        if (req.body.pricePerDay) vehicle.pricePerDay = parseFloat(req.body.pricePerDay);
        if (req.body.fuelType) vehicle.fuelType = req.body.fuelType;
        if (req.body.transmission) vehicle.transmission = req.body.transmission;
        if (req.body.seatingCapacity) vehicle.seatingCapacity = parseInt(req.body.seatingCapacity, 10);
        if (req.body.status) vehicle.status = req.body.status;
        if (req.files && req.files.length > 0) {
            vehicle.vehiclePhotos = req.files.map(f => f.path.replace(/\\/g, '/'));
        }

        const updated = await vehicle.save();
        res.status(200).json({ message: 'Vehicle updated successfully.', vehicle: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });
        if (!vehicle.isActive) return res.status(404).json({ message: 'Vehicle not found.' });

        const activeBooking = await Booking.findOne({
            vehicleId: vehicle._id,
            status: { $in: ['Confirmed', 'Awaiting_Payment'] },
        });
        if (activeBooking) {
            return res.status(409).json({
                message: 'Vehicle has an active booking (Confirmed or Awaiting Payment). Cannot be deleted.',
            });
        }

        vehicle.isActive = false;
        await vehicle.save();

        res.status(200).json({ message: 'Vehicle deactivated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createVehicle,
    getVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
};
