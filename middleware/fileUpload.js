const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const uploadsPath = path.resolve(__dirname, '../uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
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

// Middleware to process and save the image
const processAndSaveImage = async (req, res, next) => {
    if (!req.file) {
        return next(new Error('No file uploaded.'));
    }

    try {
        const fileName = Date.now() + '-' + path.parse(req.file.originalname).name + '.webp';
        const filePath = path.join(uploadsPath, fileName);

        await sharp(req.file.buffer)
            .webp({ quality: 80 })
            .toFile(filePath);

        req.file.filename = fileName; // Save the new filename in the request
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { upload, processAndSaveImage };
