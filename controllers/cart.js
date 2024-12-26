const Cart = require("../models/cartmodel");
const Product = require('../models/ProudctModel')



exports.addItemToCart = async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      const userId = req.user._id;
  
      // Validate the product ID and quantity
      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: "Invalid product ID or quantity" });
      }
  
      // Check if the product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      // Find the user's cart
      let cart = await Cart.findOne({ user: userId });
      if (!cart) {
        // If the cart does not exist, create a new one
        cart = new Cart({ user: userId, items: [] });
      }
  
      // Check if the product is already in the cart
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );
  
      if (existingItem) {
        // If the item exists, return an error
        return res.status(400).json({ message: "Product is already in the cart" });
      } else {
        // If the item does not exist, add it to the cart
        cart.items.push({ product: productId, quantity });
      }
  
      // Save the updated cart
      await cart.save();
  
      // Respond with the updated cart
      res.status(200).json(cart);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error adding item to cart" });
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
        const userId = req.user._id; 

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
       
        const cart = await Cart.findOne({ user: userId }).populate("items.product");

        console.log("Found Cart:", cart); // Debug log

        if (!cart) {
            // If no cart exists, create a new empty cart for the user
            const newCart = await Cart.create({ user: userId, items: [] });

            console.log("New Cart Created:", newCart); // Debug log

            return res.status(200).json({
                success: true,
                message: "A new cart has been created for you.",
                cart: newCart,
            });
        }

        // Map cart items for the response
        const cartedProducts = cart.items.map((item) => ({
            productId: item.product._id,
            name: item.product.name || "Unknown Product",
            price: item.product.price || 0,
            quantity: item.quantity,
            total: item.quantity * (item.product.price || 0),
            image: item.product.images?.[0] || null,
        }));

        // Calculate total quantity and price
        const totalQuantity = cart.items.reduce((acc, item) => acc + item.quantity, 0);
        const totalPrice = cartedProducts.reduce((acc, item) => acc + item.total, 0);

        // Return cart data
        res.status(200).json({
            success: true,
            cartId: cart._id,
            user: cart.user,
            totalQuantity,
            totalPrice,
            products: cartedProducts,
        });
    } catch (error) {
        console.error("Error in getCart:", error); // Debug log
        res.status(500).json({ message: "Internal server error" });
    }
};


