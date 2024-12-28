const Cart = require("../models/cartmodel");
const Product = require('../models/ProudctModel')



exports.addItemToCart = async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      const userId = req.user._id;
  
      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: "Invalid product ID or quantity" });
      }
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



exports.getCart = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming the user's ID is available in `req.user`

    // Find the user's cart by userId
    const cart = await Cart.findOne({ user: userId });

    // If no cart is found, return a 404 response
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Fetch all the product details for the carted products
    const productPromises = cart.items.map(async (item) => {
      const product = await Product.findById(item.product); // Fetch each product by ID
      if (!product) {
        throw new Error(`Product not found for ID: ${item.product}`);
      }
      return {
        product: product,   // Product details
        quantity: item.quantity,  // Quantity from the cart
      };
    });

    // Wait for all product details to be fetched
    const populatedItems = await Promise.all(productPromises);

    // Respond with the populated cart items
    res.status(200).json({
      message: "Cart fetched successfully",
      cart: populatedItems, // Send the populated items with product details and quantity
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching cart", error: error.message });
  }
};

  

  


