const Cart = require("../models/cartmodel");
const Product = require('../models/ProudctModel')

exports.addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;

        if (!userId || !productId || !quantity) {
            return res.status(400).json({ message: "All fields are required" });
        }

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



exports.clearCart = async (req, res) => {
    try {
        const { userId } = req.body;

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
exports.getCart = async (req, res) => {
    try {
        const { userId } = req.query; // Extract the user ID from the query parameters

        // Find the cart for the user and populate the product details in items
        const cart = await Cart.findOne({ user: userId }).populate("items.product");

        // If no cart exists, return a 404 response
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // Extract the products from the cart items
        const cartedProducts = cart.items.map(item => ({
            productId: item.product._id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            total: item.quantity * item.product.price,
            image: item.product.images?.[0], // Send the first image, if available
        }));

        // Send the cart and the carted products in the response
        res.status(200).json({
            success: true,
            cartId: cart._id,
            user: cart.user,
            totalQuantity: cart.items.reduce((acc, item) => acc + item.quantity, 0), // Total quantity of items
            totalPrice: cartedProducts.reduce((acc, item) => acc + item.total, 0), // Total price of items
            products: cartedProducts,
        });
    } catch (error) {
        // Send a 500 response in case of a server error
        res.status(500).json({ message: error.message });
    }
};
