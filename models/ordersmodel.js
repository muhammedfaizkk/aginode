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
            ref: "User",
            required: false,
        },
        products: [
            {
                productId: {
                    type:mongoose.Schema.Types.ObjectId,
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
        vichleNumber:{
            type: String,
            required: true,
        },
        vichleModel:{
            type: String,
            required: true,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        paymentId: {
            type: String, 
            required: false,
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Completed", "Failed"],
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
