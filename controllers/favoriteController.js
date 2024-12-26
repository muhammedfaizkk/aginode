const Favorite = require('../models/favoriteModel');
const Product = require('../models/ProudctModel');

exports.addToFavorites = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user._id; 
        const productExists = await Product.findById(productId);
        if (!productExists) {
            return res.status(404).json({ message: "Product not found" });
        }

        let favorite = await Favorite.findOne({ user: userId });

        if (!favorite) {
            favorite = await Favorite.create({
                user: userId,
                products: [{ product: productId }],
            });
        } else {
            const alreadyInFavorites = favorite.products.some(
                (item) => item.product.toString() === productId
            );

            if (!alreadyInFavorites) {
                favorite.products.push({ product: productId });
                await favorite.save();
            } else {
                return res.status(400).json({ message: "Product already in favorites" });
            }
        }

        res.status(200).json({ success: true, message: "Product added to favorites", favorite });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getFavorites = async (req, res) => {
    try {
        const userId = req.user._id;
        const favorite = await Favorite.findOne({ user: userId }).populate('products.product');

        // If no favorites are found, send a 404 response
        if (!favorite) {
            return res.status(404).json({ 
                success: false, 
                message: "No wishlisted products found." 
            });
        }

        // Map the products array to return all product details
        const wishlistedProducts = favorite.products.map((item) => ({
            productId: item.product._id,
            name: item.product.name,
            price: item.product.price,
            description: item.product.description,
            category: item.product.category,
            images: item.product.images,
            stock: item.product.stock,
            createdAt: item.product.createdAt,
            updatedAt: item.product.updatedAt,
            ...item.product._doc, // Spread all other fields dynamically
        }));

        // Send the response with all details of wishlisted products
        res.status(200).json({
            success: true,
            totalProducts: wishlistedProducts.length,
            wishlistedProducts,
        });
    } catch (error) {
        // Handle any errors
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Remove a product from favorites
exports.removeFromFavorites = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id; // Get userId from the protected route

        const favorite = await Favorite.findOne({ user: userId });

        if (!favorite) {
            return res.status(404).json({ message: "No favorites found" });
        }

        const productIndex = favorite.products.findIndex(
            (item) => item.product.toString() === productId
        );

        if (productIndex === -1) {
            return res.status(404).json({ message: "Product not found in favorites" });
        }

        // Remove the product from the favorites array
        favorite.products.splice(productIndex, 1);
        await favorite.save();

        res.status(200).json({ success: true, message: "Product removed from favorites", favorite });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
