const express = require("express");
const {
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    getCart,
} = require("../controllers/cart");

const protectRoute = require('../middleware/userAuth');

const router = express.Router();

router.route("/api/addToCart").post(protectRoute, addToCart);
router.route("/api/updateCartItemQuantity/:cartItemId").put(protectRoute, updateCartItemQuantity);  
router.route("/api/removeCartItem/:cartItemId").delete(protectRoute, removeCartItem); 
router.route("/api/clearCart").delete(protectRoute, clearCart); 
router.route("/api/getCart/:userId").get(protectRoute, getCart);
module.exports = router;
