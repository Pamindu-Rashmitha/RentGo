const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage factory for Cloudinary
const makeStorage = (subfolder) =>
    new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: `RentGo/${subfolder}`,
            allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
            // Transformation example: resize to max width of 1200px
            transformation: [{ width: 1200, crop: 'limit' }],
        },
    });

// File filter 
const imageOnlyFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG and PNG images are allowed.'), false);
    }
};

const imageOrPdfFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, or PDF files are allowed.'), false);
    }
};

// Middleware definitions
const uploadVehiclePhoto = multer({
    storage: makeStorage('vehicles'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageOnlyFilter,
}).array('vehiclePhotos', 5);

const uploadLicenseDocument = multer({
    storage: makeStorage('licenses'),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageOrPdfFilter,
}).single('licenseDocument');

const uploadReceiptImage = multer({
    storage: makeStorage('receipts'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageOnlyFilter,
}).single('receiptImage');

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
