const express = require('express');
const { addToFavorites, getFavorites, removeFromFavorites } = require('../controllers/favoriteController');
const protectRoute = require('../middleware/userAuth'); 

const router = express.Router();

router.route('/api/addToFavorites').post( protectRoute, addToFavorites);
router.route('/api/getFavorites').get(protectRoute, getFavorites);
router.route('/api/removeFromFavorites/:productId').delete(protectRoute, removeFromFavorites);

module.exports = router;
