const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String, 
            required: true,
            unique: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Reference to the User model (optional, can be null if not provided)
            required: false,
        },
        products: [
            {
                productId: {
                    type: String,  // Reference to Product model (or can be a simple String if product details are kept separately)
                    ref: "Product",  // Optional if you have a Product collection to reference
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1, // Ensure quantity is a positive integer
                },
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        paymentId: {
            type: String,  // Store Razorpay payment ID (optional)
            required: false,
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending",
        },
        address: {
            name: { type: String, required: true },
            phone: { type: String, required: true },
            email: { type: String, required: true },
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            postalCode: { type: String, required: true },
        },
        status: {
            type: String,
            enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
            default: "Pending",
        },
    },
    { timestamps: true }  // Automatically manages createdAt and updatedAt fields
);

module.exports = mongoose.model("Order", orderSchema);
