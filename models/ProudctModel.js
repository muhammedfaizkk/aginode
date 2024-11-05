const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: [true, "Please enter product name"],
        minLength: [3, "Product name should have a minimum of 5 characters!"],
        maxLength: [50, "Product name shouldn't exceed 50 characters"]
    },
    originalPrice: {
        type: Number,
        required: [true, "Please enter original price"],
        min: [0, "Price must be a positive number"]
    },
    currentPrice: {
        type: Number,
        required: [true, "Please enter current price"],
        min: [0, "Price must be a positive number"]
    },
    photographs: {
        type: [String],
        required: [true, "Please add photographs"]
    },
    specifications: {
        type: [String],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
