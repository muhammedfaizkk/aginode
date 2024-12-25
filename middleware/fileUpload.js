const multer = require('multer');
const path = require('path');

// Set storage configuration for the uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');  // Directory where files will be stored
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);  // Unique filename to avoid overwriting
    },
});

// Set file upload limits and validation
const upload = multer({
    storage,
    limits: {
        fileSize: 3 * 1024 * 1024,  // Max file size 3MB
    },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;  // Allowed file types
        const mimeType = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimeType && extname) {
            return cb(null, true);  // Accept the file
        }
        cb(new Error("Invalid file type. Only jpeg, jpg, png, gif, and webp images are allowed."));  // Reject file with appropriate error message
    },
});

module.exports = upload;
