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
        console.log('Request Body:', req.body);

        const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const { user, products, totalAmount, address } = req.body;

        // Check if products array is properly populated
        if (!Array.isArray(products) || !products.length) {
            return res.status(400).json({ message: 'Products are required' });
        }

        // Validate each product outside of the `forEach` loop
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            if (!product.productId || !product.quantity) {
                return res.status(400).json({
                    message: `Missing productId or quantity in product at index ${i}`,
                });
            }
        }

        // Validate totalAmount and address
        if (!totalAmount || !address) {
            return res.status(400).json({ message: 'Total amount and address are required' });
        }

        const { street, city, state, postalCode, phone, email, name } = address;
        if (!street || !city || !state || !postalCode || !phone || !email || !name) {
            return res.status(400).json({ message: 'Complete address details are required' });
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ message: 'Invalid phone number format' });
        }

        console.log('Validated data:', { user, products, totalAmount, address });

        // Create the order using Razorpay
        let order;
        try {
            order = await razorpayInstance.orders.create({
                amount: totalAmount * 100,
                currency: 'INR',
                receipt: uuidv4(),
                notes: {
                    description: 'Order Payment',
                    name: address.name,
                    email: address.email,
                    contact: address.phone,
                },
            });
            console.log('Order Created:', order);
        } catch (razorpayError) {
            console.error('Razorpay API Error:', razorpayError);
            return res.status(500).json({
                message: 'Error creating order',
                error: razorpayError.error?.description || 'Razorpay API Error',
            });
        }

        // Map products to match the Order schema
        const mappedProducts = products.map(product => ({
            productId: product.productId, // Ensure productId is in correct format
            quantity: product.quantity,
        }));

        // Create new order in database
        const newOrder = new Order({
            orderId: order.id,
            user,
            products: mappedProducts,
            totalAmount,
            address,
            paymentStatus: 'Pending',
        });

        console.log('New Order:', newOrder);

        await newOrder.save();

        return res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: newOrder,
            paymentLink: `https://rzp.io/l/${order.id}`,
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








exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentId, orderId } = req.body;

        if (!paymentId || !orderId) {
            return res.status(400).json({ message: "Payment ID and Order ID are required" });
        }

        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        order.paymentStatus = 'Completed';
        order.paymentId = paymentId;
        await order.save();


        const userEmail = order.address.email;
        await sendOrderConfirmationEmail(order, userEmail, 'Payment Successful');

        res.status(200).json({
            success: true,
            message: 'Payment status updated successfully',
            order,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
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

// Function to delete an order
exports.deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOneAndDelete({ orderId });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({
            success: true,
            message: "Order deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Function to get all orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email');

        const formattedOrders = await Promise.all(orders.map(async (order) => {
            const productsDetails = await Promise.all(order.products.map(async (item) => {
                const product = await Product.findById(item.productId);
                if (product) {
                    return {
                        productName: product.productName,
                        price: product.price,
                        quantity: item.quantity,
                        totalPrice: item.quantity * product.price,
                    };
                } else {
                    return null;
                }
            }));

            return {
                orderId: order.orderId,
                user: order.user,
                products: productsDetails.filter(product => product !== null),
                totalAmount: order.totalAmount,
                address: order.address,
                status: order.status,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            };
        }));

        res.status(200).json({
            success: true,
            orders: formattedOrders,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
