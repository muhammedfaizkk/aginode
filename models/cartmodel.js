const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Reference to the User model
            required: true,
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product", // Reference to the Product model
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: [1, "Quantity must be at least 1"], // Validation for minimum quantity
                },
            },
        ],
    },
    {
        timestamps: true, // Automatically includes createdAt and updatedAt fields
    }
);

// Virtual property to calculate total price
cartSchema.virtual("totalPrice").get(function () {
    return this.items.reduce((total, item) => {
        const productPrice = item.product?.price || 0; // Assumes populated product with price
        return total + item.quantity * productPrice;
    }, 0);
});

module.exports = mongoose.model("Cart", cartSchema);
