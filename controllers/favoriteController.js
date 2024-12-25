const Favorite = require('../models/favoriteModel');
const Product = require('../models/ProudctModel');

// Add a product to the favorites
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

        if (!favorite) {
            return res.status(404).json({ message: "No favorites found" });
        }

        const favoriteProducts = favorite.products.map((item) => ({
            productId: item.product._id,
            name: item.product.name,
            price: item.product.price,
            image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : null,
        }));

        res.status(200).json({
            success: true,
            favorites: favoriteProducts,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
