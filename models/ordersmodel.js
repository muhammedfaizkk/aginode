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
        vehicleModel: {
          type: String,
          required: false,
        },
        vehicleNumber: {
          type: String,
          required: false,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: String,
      required: function () {
        return this.paymentStatus === "Completed";
      },
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },
    paymentAttempts: [
      {
        attemptId: { type: String, required: true },
        paymentId: { type: String },
        status: { type: String, enum: ["Pending", "Completed", "Failed"], required: true },
        razorpayResponse: { type: mongoose.Schema.Types.Mixed },
        error: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    address: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
