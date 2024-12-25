const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Assuming you have a User model
        required: true,
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',  // Assuming you have a Product model
                required: true,
            },
        },
    ],
});

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
