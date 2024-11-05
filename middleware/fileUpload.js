const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name:'djjo6evky',
    api_key: 968835199376537,
    api_secret: 'kCOm5DSVGymQ85gJJ7nsdJayWZI',
});

// Set up Multer to upload directly to Cloudinary and allow all image formats
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'capstone',  // Specify your folder in Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff'],  // Allowed image formats
        public_id: (req, file) => file.originalname.split('.')[0] + '-' + Date.now(),  // Create a unique name for the image
    },
});

// Multer configuration
const upload = multer({ storage });

module.exports = upload;
