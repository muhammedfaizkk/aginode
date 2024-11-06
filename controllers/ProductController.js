const Product = require('../models/ProudctModel');
const admin = require('../models/adminModel')
const bcrypt = require('bcryptjs'); // For hashing passwords
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

exports.adminSignin = async (req, res, next) => {
    try {
        const { userName, password } = req.body;

        if (!userName || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        // Find the admin by username
        const existingAdmin = await admin.findOne({ userName });
        if (!existingAdmin) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, existingAdmin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Generate a token (JWT)
        const token = jwt.sign(
            { id: existingAdmin._id, userName: existingAdmin.userName },
            process.env.JWT_SECRET_KEY, // Make sure to have a secret key in your .env file
            { expiresIn: '1h' } // Token expiration time
        );

        // Send the token and a success message
        res.status(200).json({ token, message: "Logged in successfully" });
    } catch (error) {
        next(error);
    }
};

exports.addProducts = async (req, res, next) => {
    const { productName, originalPrice, currentPrice,specifications} = req.body;
   
    try {
        const photographs = req.files.map(file => file.path);  
        console.log(photographs);
        
        const product = await Product.create({
            productName,
            originalPrice,
            currentPrice,
            specifications,
            photographs,  
        });

        if (!product) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }
        res.status(200).json({
            success: true,
            message: "Product added successfully",
            product,
        });
    } catch (error) {
        // Handle any errors that occur during the process
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};





exports.getAllproducts = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 12; // Set the limit to 12 products per page
    const skip = (page - 1) * limit;

    try {
        const products = await Product.find()
            .skip(skip)
            .limit(limit);

        // Get total count of products for pagination info
        const totalCount = await Product.countDocuments();

        if (!products || products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No products found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Products retrieved successfully",
            products,
            totalPages: Math.ceil(totalCount / limit), // Calculate total number of pages
            currentPage: page // Current page number
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



exports.getProduct = async (req, res, next) => {
    const { id } = req.params;

    try {
        const findedProduct = await Product.findById(id); // Pass the ID to findById()
        console.log(findedProduct);
        
        if (!findedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product retrieved successfully",
            findedProduct,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


const deleteImagesWithRetry = async (publicIds, retries = 3, delay = 1000) => {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const result = await cloudinary.api.delete_resources(publicIds, { timeout: 5000 });
            return result;
        } catch (error) {
            if (attempt === retries - 1) {
                throw error; 
            }
            console.warn(`Retrying deleteImages... Attempt ${attempt + 1}`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        console.log(product);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (product.photographs && product.photographs.length > 0) {
            const publicIds = product.photographs.map(url => {
                const parts = url.split('/');
                const fileWithExtension = parts[parts.length - 1]; // Extract file name with extension
                const publicId = fileWithExtension.split('.')[0];  // Remove extension
                const folder = parts[parts.length - 2];  // Folder name in Cloudinary
                return `${folder}/${publicId}`;  // Public ID format for Cloudinary
            });
            const result = await deleteImagesWithRetry(publicIds);
            
            // Check Cloudinary response for any issues
            if (result.deleted && Object.values(result.deleted).some(status => status === 'not_found')) {
                return res.status(400).json({
                    success: false,
                    message: "Some images were not found on Cloudinary",
                    details: result.deleted
                });
            }
        }

        // Delete the product from the database
        await Product.findByIdAndDelete(req.params.id);

        // Success response
        res.status(200).json({
            success: true,
            message: "Product and associated images deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting product or images:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while deleting the product or images",
            details: error.message // Provide details about the error
        });
    }
};
