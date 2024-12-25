const Product = require('../models/ProudctModel');
const fs = require('fs');
const path = require('path');

// Add Product
exports.addProduct = async (req, res) => {
    const { productName, originalPrice, currentPrice, specifications, category } = req.body;

    try {
        const photographs = req.files.map(file => `/uploads/${file.filename}`);

        const product = await Product.create({
            productName,
            originalPrice,
            currentPrice,
            specifications,
            photographs,
            category,
        });

        res.status(201).json({
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

exports.getAllProducts = async (req, res) => {
    try {
        
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const products = await Product.find().skip(skip).limit(limit);

        const totalProducts = await Product.countDocuments();

        res.status(200).json({
            success: true,
            pagination: {
                totalProducts,
                currentPage: page,
                totalPages: Math.ceil(totalProducts / limit),
                hasNextPage: page * limit < totalProducts,
                hasPreviousPage: page > 1,
            },
            products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Update Product
exports.updateProduct = async (req, res) => {
    const { productName, originalPrice, currentPrice, specifications, category } = req.body;

    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Handle file updates
        if (req.files && req.files.length > 0) {
            // Remove old images
            product.photographs.forEach(filePath => {
                const fullPath = path.join(__dirname, `../${filePath}`);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            });

            // Add new file paths
            product.photographs = req.files.map(file => `/uploads/${file.filename}`);
        }

        // Update product fields
        product.productName = productName || product.productName;
        product.originalPrice = originalPrice || product.originalPrice;
        product.currentPrice = currentPrice || product.currentPrice;
        product.specifications = specifications || product.specifications;
        product.category = category || product.category;

        await product.save();

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Remove associated images
        product.photographs.forEach(filePath => {
            const fullPath = path.join(__dirname, `../${filePath}`);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        });

        // Delete product
        await Product.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Product and associated images deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
