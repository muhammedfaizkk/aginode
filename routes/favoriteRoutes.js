const express = require('express');
const { addToFavorites, getFavorites, removeFromFavorites } = require('../controllers/favoriteController');
const protectRoute = require('../middleware/userAuth');

const router = express.Router();

// Add to Favorites
router.post('/addToFavorites', protectRoute, addToFavorites)
router.get('/getFavorites', protectRoute, getFavorites);
router.delete('/removeFromFavorites/:productId', protectRoute, removeFromFavorites);

module.exports = router;
