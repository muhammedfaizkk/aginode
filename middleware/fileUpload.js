const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const uploadsPath = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsPath);
    },
    filename: async (req, file, cb) => {
        const fileName = Date.now() + '-' + file.originalname.split('.')[0] + '.webp'; // Convert to webp format
        const filePath = path.join(uploadsPath, fileName);

        // Convert and save the file as .webp
        sharp(file.buffer)
            .webp()
            .toFile(filePath, (err, info) => {
                if (err) {
                    return cb(err);
                }
                cb(null, fileName); // Pass the new filename
            });
    },
});

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

module.exports = upload;
