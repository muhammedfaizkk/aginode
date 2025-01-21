const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        address: {
            street: {
                type: String,
                required: true,
            },
            city: {
                type: String,
                required: true,
            },
            state: {
                type: String,
                required: true,
            },
            postalCode: {
                type: String,
                required: true,
            },
            phone: {
                type: String,
                required: true, // Make phone number required
            },
            email: {
                type: String,
                required: true, // Make email address required
                match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Regex to validate email format
            },
        },
        status: {
            type: String,
            enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
            default: "Pending",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
