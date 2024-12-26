const mongoose = require("mongoose");
const Product = require("./ProudctModel"); // Ensure the Product model is imported

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

const Cart = mongoose.model("Cart", cartSchema);