const Order = require('../models/ordersmodel');
const Product = require('../models/ProudctModel');
const User = require('../models/usersmodel');  // Assuming the user model is named 'UserModel'
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');
const mongoose = require("mongoose");
require('dotenv').config();

async function sendOrderConfirmationEmail(order, userEmail, paymentLink) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `Order Confirmation - Order #${order.orderId}`,
        html: `
            <h1>Order Confirmation</h1>
            <p>Thank you for your order!</p>
            <p><strong>Order ID:</strong> ${order.orderId}</p>
            <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
            <p><strong>Order Placed At:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <h3>Shipping Address</h3>
            <p>${order.address.street}, ${order.address.city}, ${order.address.state}, ${order.address.postalCode}</p>
            <p><strong>Contact:</strong> ${order.address.phone}</p>
            <p><a href="${paymentLink}" target="_blank">Click here to make the payment</a></p>
        `,
    };

    await transporter.sendMail(mailOptions);
}

exports.createOrder = async (req, res) => {
    try {
        const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const { user, products, totalAmount, address } = req.body;

        // Validate products structure
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'Products are required' });
        }

        // Normalize products if necessary (based on your incoming data format)
        const normalizedProducts = [];
        for (let i = 0; i < products.length; i++) {
            const product = products[i];

            // Check if both productId and quantity are present
            if (!product.productId || !product.quantity) {
                return res.status(400).json({
                    message: `Missing productId or quantity in product at index ${i}`,
                });
            }

            // Ensure quantity is a valid positive integer
            const quantity = parseInt(product.quantity, 10);
            if (isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({ message: `Invalid quantity at index ${i}` });
            }

            normalizedProducts.push({
                productId: product.productId,
                quantity,
            });
        }

        req.body.products = normalizedProducts;

        // Validate totalAmount and address
        if (!totalAmount || !address) {
            return res.status(400).json({ message: 'Total amount and address are required' });
        }

        const { street, city, state, postalCode, phone, email, name } = address;
        if (!street || !city || !state || !postalCode || !phone || !email || !name) {
            return res.status(400).json({ message: 'Complete address details are required' });
        }

        // Validate email format
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Validate phone number format
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ message: 'Invalid phone number format' });
        }

        // Create Razorpay order
        let razorpayOrder;
        try {
            razorpayOrder = await razorpayInstance.orders.create({
                amount: totalAmount * 100, // Razorpay expects amount in paise
                currency: 'INR',
                receipt: uuidv4(),
                notes: {
                    description: 'Order Payment',
                    name: address.name,
                    email: address.email,
                    contact: address.phone,
                },
            });
        } catch (razorpayError) {
            console.error('Razorpay API Error:', razorpayError);
            return res.status(500).json({
                message: 'Error creating order',
                error: razorpayError.error?.description || 'Razorpay API Error',
            });
        }

        // Create database order entry
        const mappedProducts = req.body.products.map(product => ({
            productId: product.productId,
            quantity: product.quantity,
        }));

        const newOrder = new Order({
            orderId: razorpayOrder.id,
            user,
            products: mappedProducts,
            totalAmount,
            address,
            paymentStatus: 'Pending',
        });

        await newOrder.save();

        // Send response with payment link
        return res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: newOrder,
        });
    } catch (error) {
        console.error('Error creating order:', error);
        if (!res.headersSent) {
            return res.status(500).json({
                message: 'An error occurred while creating the order',
                error: error.message || error,
            });
        }
    }
};







exports.verifyPayment = async (req, res) => {
    try {
        const { paymentId, orderId, razorpayPaymentId, razorpaySignature } = req.body; // Details sent from frontend

        if (!paymentId || !orderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: "Payment ID, Order ID, Razorpay Payment ID, and Signature are required" });
        }

        // Verify the payment with Razorpay (use Razorpay's API or SDK to verify payment)
        const paymentVerificationResponse = await verifyRazorpayPayment(razorpayPaymentId, razorpaySignature);

        if (!paymentVerificationResponse.success) {
            return res.status(400).json({ message: "Payment verification failed" });
        }
        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // If the payment is successful, update the order payment status and paymentId
        order.paymentStatus = 'Completed';
        order.paymentId = paymentId;
        await order.save();

        // Send an email confirmation (assuming you have an email service)
        const userEmail = order.address.email;
        await sendOrderConfirmationEmail(order, userEmail, 'Payment Successful');

        res.status(200).json({
            success: true,
            message: 'Payment verified and order updated successfully',
            order,
        });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

// Helper function to verify Razorpay payment (using Razorpay API)
const verifyRazorpayPayment = async (razorpayPaymentId, razorpaySignature) => {
    const razorpaySecret = process.env.RAZORPAY_SECRET_KEY; // Your Razorpay secret key

    const body = razorpayPaymentId + '|' + razorpaySignature;
    const crypto = require('crypto');
    const expectedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(body)
        .digest('hex');

    if (expectedSignature === razorpaySignature) {
        return { success: true };
    } else {
        return { success: false };
    }
};


exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

        if (!['Pending', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const order = await Order.findOneAndUpdate({ orderId }, { status }, { new: true });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()

        return res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({
            message: 'An error occurred while fetching orders',
            error: error.message || error,
        });
    }
};
// Function to get an order by ID
exports.getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOne({ orderId })
            .populate('user', 'name email')
            .populate('products.productId', 'productName price');

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




exports.deleteOrderAdmin = async (req, res) => {
    try {
        // Check if the user is an admin (ensure req.user has the role or authorization
        const { orderId } = req.params;

        // Find and delete the order by its orderId
        const order = await Order.findOneAndDelete({ orderId });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Return success response
        return res.status(200).json({
            success: true,
            message: `Order with orderId ${orderId} deleted successfully.`,
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        return res.status(500).json({
            message: 'An error occurred while deleting the order',
            error: error.message || error,
        });
    }
};



exports.deleteOrderUser = async (req, res) => {
    try {
        // Get the userId from the decoded token (req.user) and the orderId from params
        const { orderId } = req.params;
        const userId = req.user._id; // Assumes req.user contains the decoded user info from JWT

        // Find the order by its orderId and check if it belongs to the user
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You can only delete your own orders' });
        }

        // Delete the order
        await Order.findOneAndDelete({ orderId });

        // Return success response
        return res.status(200).json({
            success: true,
            message: `Order with orderId ${orderId} deleted successfully.`,
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        return res.status(500).json({
            message: 'An error occurred while deleting the order',
            error: error.message || error,
        });
    }
};


exports.deleteAllOrders = async (req, res) => {
    try {
        const result = await Order.deleteMany({}); // Deletes all orders in the collection

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} orders deleted successfully`,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};