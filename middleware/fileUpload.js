const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Resolve the uploads directory path relative to the middleware folder
const uploadsPath = path.resolve(__dirname, '../uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimeType = filetypes.test(file.mimetype);
        const extname = filetypes.test(file.originalname.toLowerCase());

        if (mimeType && extname) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type. Only jpeg, jpg, png, gif, and webp are allowed.'));
    },
});

module.exports = upload;
