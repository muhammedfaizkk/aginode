const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsPath = path.resolve(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Multer storage configuration to save files directly to disk
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsPath); // Save images in the uploads directory
    },
    filename: (req, file, cb) => {
        const fileBaseName = path.basename(file.originalname, path.extname(file.originalname));
        const fileName = `${Date.now()}-${fileBaseName}${path.extname(file.originalname)}`;
        cb(null, fileName);
    }
});

// Initialize multer instance
const upload = multer({ 
    storage, 
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit 
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimeType = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimeType && extname) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type. Only JPEG, JPG, PNG, GIF, and WEBP are allowed.'));
    }
});

// Middleware to process images (store file paths in req.body)
const processImages = (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next(); // No files uploaded, proceed
    }

    try {
        req.body.photographs = req.files.map(file => `/uploads/${file.filename}`);
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    upload, 
    processImages
};
