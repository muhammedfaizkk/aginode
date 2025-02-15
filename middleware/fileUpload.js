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
        return next(); // No files uploaded, proceed
    }

    try {
        req.body.photographs = await Promise.all(
            req.files.map(async (file) => {
                if (!file.originalname) {
                    console.error("File name is undefined:", file);
                    return null; // Prevent storing "undefined" paths
                }

                // ✅ Extract filename without extension
                const fileBaseName = path.basename(file.originalname, path.extname(file.originalname));
                const fileName = `${Date.now()}-${fileBaseName}.webp`;
                const filePath = `/uploads/${fileName}`;

                await sharp(file.buffer)
                    .webp({ quality: 80 })
                    .toFile(path.join(uploadsPath, fileName));

                return filePath; // Save the correct WebP path
            })
        );

        // Filter out null values
        req.body.photographs = req.body.photographs.filter(Boolean);

        next();
    } catch (error) {
        next(error);
    }
};




module.exports = {
    upload, 
    processImages
};