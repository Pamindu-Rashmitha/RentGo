const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Ensure upload directories exist
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

ensureDir('uploads/vehicles');
ensureDir('uploads/licenses');
ensureDir('uploads/receipts');
ensureDir('uploads/maintenance');

// Storage factory
const makeStorage = (subfolder) =>
    multer.diskStorage({
        destination: (req, file, cb) => cb(null, `uploads/${subfolder}`),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, `${uuidv4()}${ext}`);
        },
    });

// File filter: JPEG/PNG only
const imageOnlyFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG and PNG images are allowed.'), false);
    }
};

// File filter: JPEG/PNG/PDF
const imageOrPdfFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, or PDF files are allowed.'), false);
    }
};

// Vehicle photo 
const uploadVehiclePhoto = multer({
    storage: makeStorage('vehicles'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageOnlyFilter,
}).array('vehiclePhotos', 5);

// License document 
const uploadLicenseDocument = multer({
    storage: makeStorage('licenses'),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageOrPdfFilter,
}).single('licenseDocument');

// Receipt image
const uploadReceiptImage = multer({
    storage: makeStorage('receipts'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageOnlyFilter,
}).single('receiptImage');

// Damage photos
const uploadDamagePhotos = multer({
    storage: makeStorage('maintenance'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageOnlyFilter,
}).array('damagePhotos', 5);

// Wrapper to convert Multer callback errors into Express errors
const wrapUpload = (uploadFn) => (req, res, next) => {
    uploadFn(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'File too large. Check size limits.' });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ message: 'Maximum photo upload limit exceeded.' });
            }
            return res.status(400).json({ message: err.message });
        }
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

module.exports = {
    uploadVehiclePhoto: wrapUpload(uploadVehiclePhoto),
    uploadLicenseDocument: wrapUpload(uploadLicenseDocument),
    uploadReceiptImage: wrapUpload(uploadReceiptImage),
    uploadDamagePhotos: wrapUpload(uploadDamagePhotos),
};
