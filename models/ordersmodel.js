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
        paymentId: {
            type: String,  // Store Razorpay payment ID
            required: false,
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending",
        },
        address: {
            name:String,
            phone: String,
            email: String,
            street: String,
            city: String,
            state: String,
            postalCode: String,
           
        },
        status: {
            type: String,
            enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
            default: "Pending",
        },
    },
    { timestamps: true }  // Automatically manages createdAt and updatedAt
);

module.exports = mongoose.model("Order", orderSchema);
