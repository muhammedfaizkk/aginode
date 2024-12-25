const Cart = require("../models/cartmodel");
const Product = require('../models/ProudctModel')



exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({ message: "Product ID and quantity are required" });
        }

        const userId = req.user._id; // Get userId from the protected route

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            // Create a new cart if none exists
            cart = await Cart.create({
                user: userId,
                items: [{ product: productId, quantity }],
            });
        } else {
            // Check if product already exists in the cart
            const existingItem = cart.items.find(
                (item) => item.product.toString() === productId
            );

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({ product: productId, quantity });
            }

            await cart.save();
        }

        res.status(200).json({ success: true, message: "Item added to cart", cart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update product quantity in the cart
exports.updateCartItemQuantity = async (req, res) => {
    try {
        const { cartItemId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ message: "Quantity must be greater than zero" });
        }

        const cart = await Cart.findOneAndUpdate(
            { "items._id": cartItemId },
            { $set: { "items.$.quantity": quantity } },
            { new: true }
        );

        if (!cart) {
            return res.status(404).json({ message: "Cart item not found" });
        }

        res.status(200).json({ success: true, message: "Quantity updated", cart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Remove product from cart
exports.removeCartItem = async (req, res) => {
    try {
        const { cartItemId } = req.params;

        const cart = await Cart.findOneAndUpdate(
            { "items._id": cartItemId },
            { $pull: { items: { _id: cartItemId } } },
            { new: true }
        );

        if (!cart) {
            return res.status(404).json({ message: "Cart item not found" });
        }

        res.status(200).json({ success: true, message: "Item removed from cart", cart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Clear all items in the cart
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user._id; // Get userId from the protected route

        const cart = await Cart.findOneAndUpdate(
            { user: userId },
            { $set: { items: [] } },
            { new: true }
        );

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        res.status(200).json({ success: true, message: "Cart cleared", cart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get cart details
exports.getCart = async (req, res) => {
    try {
        const userId = req.user._id; // Get userId from the protected route

        // Check if userId is valid
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // Log userId to debug
        console.log('User ID:', userId);

        // Find the cart for the user
        const cart = await Cart.findOne({ user: userId }).populate("items.product");

        // Log cart to debug
        console.log('Found Cart:', cart);

        if (!cart) {
            // Create a cart for the user if it doesn't exist
            const newCart = await Cart.create({
                user: userId,
                items: [],
            });

            // Log newly created cart
            console.log('New Cart Created:', newCart);

            return res.status(200).json({
                success: true,
                message: "Cart was created for you",
                cart: newCart,
            });
        }

        // Map cart items and format response
        const cartedProducts = cart.items.map(item => ({
            productId: item.product._id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            total: item.quantity * item.product.price,
            image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : null,
        }));

        // Send response with cart data
        res.status(200).json({
            success: true,
            cartId: cart._id,
            user: cart.user,
            totalQuantity: cart.items.reduce((acc, item) => acc + item.quantity, 0),
            totalPrice: cartedProducts.reduce((acc, item) => acc + item.total, 0),
            products: cartedProducts,
        });
    } catch (error) {
        console.error('Error:', error); // Log error for debugging
        res.status(500).json({ message: error.message });
    }
};

