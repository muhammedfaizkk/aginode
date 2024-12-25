const express = require('express');
const { addToFavorites, getFavorites, removeFromFavorites } = require('../controllers/favoriteController');
const protectRoute = require('../middleware/userAuth'); 

const router = express.Router();

// Route to add a product to favorites
router.route('/api/addToFavorites').post(protectRoute, addToFavorites);

// Route to get all favorite products
router.route('/api/getFavorites').get(protectRoute, getFavorites);

// Route to remove a product from favorites
router.route('/api/removeFromFavorites/:productId').delete(protectRoute, removeFromFavorites);

module.exports = router;
