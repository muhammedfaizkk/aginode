const Order = require('../models/ordersmodel');
const Product = require('../models/ProudctModel');
const User = require('../models/usersmodel');  // Assuming the user model is named 'UserModel'
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');
const crypto = require('crypto');
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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #4CAF50;">Thank You for Your Order!</h1>
                <p style="font-size: 18px; color: #555;">We're excited to let you know that your order has been confirmed.</p>
            </div>

            <div style="background-color: #ffffff; padding: 15px 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 5px;">Order Details</h2>
                <p style="margin: 10px 0;"><strong>Order ID:</strong> ${order.orderId}</p>
                <p style="margin: 10px 0;"><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
                <p style="margin: 10px 0;"><strong>Order Placed At:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            </div>

            <div style="margin-top: 20px; background-color: #ffffff; padding: 15px 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 5px;">Shipping Address</h2>
                <p style="margin: 10px 0;">${order.address.street},</p>
                <p style="margin: 10px 0;">${order.address.city}, ${order.address.state} - ${order.address.postalCode}</p>
                <p style="margin: 10px 0;"><strong>Contact:</strong> ${order.address.phone}</p>
            </div>

            <div style="margin-top: 20px; text-align: center;">
                <p style="font-size: 16px; color: #555;">If you have any questions, please contact our <a href="mailto:support@example.com" style="color: #4CAF50; text-decoration: none;">support team</a>.</p>
                <p style="font-size: 16px; color: #555;">Thank you for shopping with us!</p>
            </div>
        </div>
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

        const { user, products, totalAmount, address , vichleNumber , vichleModel} = req.body;

        // Validate products structure
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'Products are required' });
        }


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

        const newOrderData = {
            orderId: razorpayOrder.id,
            products: mappedProducts,
            totalAmount,
            address,
            vichleNumber,
            vichleModel,
            paymentStatus: 'Pending',
        };

        // Add the user to the order only if it exists
        if (user) {
            newOrderData.user = user;
        }

        // Create the new order
        const newOrder = new Order(newOrderData);

        // Save the order
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
        const { orderId, razorpayPaymentId, razorpaySignature } = req.body; // Details sent from frontend

        if (!orderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: "Order ID, Razorpay Payment ID, and Signature are required" });
        }

        // Verify the payment with Razorpay
        const isPaymentVerified = verifyRazorpayPayment(orderId, razorpayPaymentId, razorpaySignature);

        if (!isPaymentVerified) {
            return res.status(400).json({ message: "Payment verification failed" });
        }

        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // If the payment is successful, update the order payment status and paymentId
        order.paymentStatus = 'Completed';
        order.paymentId = razorpayPaymentId;
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
        console.error('Error verifying payment:', error.message, error.stack);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

// Function to verify Razorpay payment
const verifyRazorpayPayment = (orderId, razorpayPaymentId, razorpaySignature) => {
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET; // Your Razorpay secret key

    if (!razorpaySecret) {
        console.error('Razorpay secret key is not defined');
        throw new Error('Razorpay secret key is missing');
    }

    const body = `${orderId}|${razorpayPaymentId}`; // Correct body format
    const expectedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(body)
        .digest('hex');

    return expectedSignature === razorpaySignature; // Returns true or false
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
        // Extract page and limit from query parameters with default values
        const page = parseInt(req.query.page) || 1; // Default page is 1
        const limit = parseInt(req.query.limit) || 20; // Default limit is 20

        // Calculate the skip value
        const skip = (page - 1) * limit;

        // Fetch orders with pagination
        const orders = await Order.find()
            .skip(skip)
            .limit(limit);

        // Get total order count for pagination metadata
        const totalOrders = await Order.countDocuments();

        return res.status(200).json({
            success: true,
            orders,
            pagination: {
                totalOrders,
                currentPage: page,
                totalPages: Math.ceil(totalOrders / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({
            message: 'An error occurred while fetching orders',
            error: error.message || error,
        });
    }
};

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

exports.getOrdersByUserId = async (req, res) => {
    try {
      let userId = req.user._id;
  
      // Convert `userId` to an ObjectId if it's a string
      if (typeof userId === "string") {
        userId = new mongoose.Types.ObjectId(userId);
      }
  
      const orders = await Order.find({ user: userId })
        .populate("user", "name email")
        .populate("products.productId", "productName price");
  
      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: "No orders found for this user" });
      }
  
      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: error.message });
    }
  };



exports.deleteOrderAdmin = async (req, res) => {
    try {
        const { orderId } = req.params;
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