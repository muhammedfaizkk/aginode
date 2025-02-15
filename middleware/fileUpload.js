const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const uploadsPath = path.resolve(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Multer memory storage (since we process images before saving)
const storage = multer.memoryStorage();

// Correctly initialize multer instance
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

// Middleware to process images (convert to WebP)
const processImages = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next(new Error('No files uploaded'));
    }

    try {
        req.processedFiles = await Promise.all(
            req.files.map(async (file) => {
                // Generate unique filename
                const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}.webp`;
                const filePath = `/uploads/${fileName}`;  // Save relative path

                await sharp(file.buffer)
                    .webp({ quality: 80 })
                    .toFile(path.join(uploadsPath, fileName));

                return filePath;  // Save only relative path
            })
        );

        req.body.photographs = req.processedFiles;

        next();
    } catch (error) {
        next(error);
    }
};


module.exports = {
    upload, 
    processImages
};