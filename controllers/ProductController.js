const Product = require('../models/ProudctModel');
const admin = require('../models/adminModel')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;



exports.addProducts = async (req, res, next) => {

    const { productName, originalPrice, currentPrice, specifications, category } = req.body;

    try {
        const photographs = req.files.map(file => file.path);
      
        const product = await Product.create({
            productName,
            originalPrice,
            currentPrice,
            specifications,
            photographs,
            category,
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
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};





exports.getAllproducts = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; 
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
            totalPages: Math.ceil(totalCount / limit), 
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
        const findedProduct = await Product.findById(id); 
        
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

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { productName, originalPrice, currentPrice, specifications, category } = req.body;
    const newImages = req.files ? req.files.map(file => file.path) : []; // Get new images if uploaded

    try {
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Delete old images if new ones are provided
        if (newImages.length > 0 && product.photographs.length > 0) {
            const publicIds = product.photographs.map((url) => {
                const parts = url.split('/');
                const fileWithExtension = parts[parts.length - 1];
                const publicId = fileWithExtension.split('.')[0];
                const folder = parts[parts.length - 2];
                return `${folder}/${publicId}`;
            });
            await deleteImagesWithRetry(publicIds);
        }

        // Update product details
        product.productName = productName || product.productName;
        product.originalPrice = originalPrice || product.originalPrice;
        product.currentPrice = currentPrice || product.currentPrice;
        product.specifications = specifications || product.specifications;
        product.category = category || product.category;
        if (newImages.length > 0) product.photographs = newImages;

        const updatedProduct = await product.save();

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while updating the product",
            details: error.message,
        });
    }
};
