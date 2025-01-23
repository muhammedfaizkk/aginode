const Order = require('../models/ordersmodel');
const Product = require('../models/ProudctModel');
const User = require('../models/usersmodel');  // Assuming the user model is named 'UserModel'
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');
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

        // Validate input data
        if (!products.length || !totalAmount || !address) {
            return res.status(400).json({ message: 'All fields are required' });
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

        // Create Razorpay Payment Link
        const paymentLink = await razorpayInstance.paymentLink.create({
            amount: totalAmount * 100, // Amount in paise
            currency: 'INR',
            receipt: uuidv4(),
            description: 'Order Payment',
            customer: {
                name,
                email,
            },
            notify: {
                email: true,
            },
            expire_by: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
        });

        // Save the order in the database
        const order = new Order({
            orderId: paymentLink.id,
            user,
            products,
            totalAmount,
            address,
            paymentStatus: 'Pending',
        });

        await order.save();

        // Send confirmation email with payment link
        await sendOrderConfirmationEmail(order, email, paymentLink.short_url);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order,
            paymentLink: paymentLink.short_url,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while creating the order', error: error.message });
    }
};


// Function to update payment status
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

// Function to update order status
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
