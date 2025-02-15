const Product = require('../models/ProudctModel');
const fs = require('fs');
const path = require('path');

exports.addProduct = async (req, res) => {
    const { productName, originalPrice, currentPrice, specifications, category, subcategory } = req.body;

    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: "No images uploaded" });
        }

        const photographs = req.files.map(file => `/uploads/${file.filename}`);

        const product = await Product.create({
            productName,
            originalPrice,
            currentPrice,
            specifications,
            photographs,
            category,
            subcategory
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
        const { page = 1, limit = 10, subcategory, search } = req.query;

        // Validate page and limit to ensure they are valid integers
        const pageNumber = parseInt(page) > 0 ? parseInt(page) : 1;
        const limitNumber = parseInt(limit) > 0 ? parseInt(limit) : 10;

        const skip = (pageNumber - 1) * limitNumber;

        // Initialize the filter object
        const filter = {};

        console.log(subcategory,'<----:subcategory');
        
        if (subcategory) {
            filter.subcategory = subcategory;
        }

        // Add search filter if provided
        if (search) {
            filter.productName = { $regex: search, $options: 'i' }; // Case-insensitive search
        }

        // Debug log to check the filter and pagination
        console.log('Filter:', filter);

        // Fetch products based on filter, skipping and limiting for pagination
        const products = await Product.find(filter).skip(skip).limit(limitNumber);
        const totalProducts = await Product.countDocuments(filter); 

        // Calculate pagination details
        const pagination = {
            totalProducts,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalProducts / limitNumber),
            hasNextPage: pageNumber * limitNumber < totalProducts,
            hasPreviousPage: pageNumber > 1,
        };

        // Debug log to check the pagination details
        console.log('Pagination:', pagination);

        // Respond with the products and pagination data
        res.status(200).json({
            success: true,
            pagination,
            products,
        });

    } catch (error) {
        // Log the error for debugging purposes
        console.error('Error fetching products:', error);

        // Respond with an error message
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
    const { productName, originalPrice, currentPrice, specifications, category,subcategory } = req.body;

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
        product.subcategory = subcategory || product.subcategory;

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
