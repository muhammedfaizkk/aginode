const Order = require('../models/ordersmodel');
const Cart = require("../models/cartmodel");
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

    const { user, products, totalAmount, address } = req.body;

    // Validate products
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Products are required' });
    }

    const normalizedProducts = [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      if (!product.productId || !product.quantity) {
        return res.status(400).json({
          message: `Missing productId or quantity at index ${i}`,
        });
      }

      const quantity = parseInt(product.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({
          message: `Invalid quantity at index ${i}`,
        });
      }

      normalizedProducts.push({
        productId: product.productId,
        quantity,
        vehicleModel: product.vehicleModel || null,
        vehicleNumber: product.vehicleNumber || null,
      });
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

    // Create Razorpay Order
    let razorpayOrder;
    try {
      razorpayOrder = await razorpayInstance.orders.create({
        amount: totalAmount * 100, // Convert to paise
        currency: 'INR',
        receipt: uuidv4(),
        notes: {
          description: 'Order Payment',
          name,
          email,
          contact: phone,
        },
      });
    } catch (err) {
      console.error('Razorpay API Error:', err);
      return res.status(500).json({ message: 'Error creating Razorpay order' });
    }

    // Create DB Order
    const newOrder = new Order({
      orderId: razorpayOrder.id,
      user: user || null,
      products: normalizedProducts,
      totalAmount,
      address,
      paymentStatus: 'Pending',
    });

    await newOrder.save();

    // Clear cart if user exists
    if (user) {
      await Cart.deleteOne({ user });
      console.log(`Cart cleared for user: ${user}`);
    }

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: newOrder,
      razorpayOrderId: razorpayOrder.id,
    });

  } catch (error) {
    console.error('createOrder Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};


const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

// Payment Verification via Frontend Callback
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayPaymentId, razorpaySignature } = req.body;
   console.log('razorpayPaymentId, razorpaySignature----->',razorpayPaymentId, razorpaySignature);
   
    if (!orderId) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const attemptId = uuidv4();

    const isVerified = verifyRazorpaySignature(orderId, razorpayPaymentId, razorpaySignature);
    if (!isVerified) {
      const failedAttempt = {
        attemptId,
        paymentId: razorpayPaymentId,
        status: 'Failed',
        error: { message: 'Signature verification failed' },
        timestamp: new Date()
      };
      order.paymentAttempts.push(failedAttempt);
      order.paymentStatus = 'Failed';
      await order.save();
      return res.status(400).json({ message: 'Signature verification failed' });
    }

    // Record successful payment
    const paymentAttempt = {
      attemptId,
      paymentId: razorpayPaymentId,
      status: 'Completed',
      razorpayResponse: { signature: razorpaySignature, verified: true },
      timestamp: new Date()
    };

    order.paymentStatus = 'Completed';
    order.paymentId = razorpayPaymentId;
    order.paymentAttempts.push(paymentAttempt);

    await order.save();

    // Send confirmation email
    try {
      await sendOrderConfirmationEmail(order, order.address.email);
    } catch (err) {
      console.error('Email error:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      attemptId,
      order
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Razorpay Webhook Handler
exports.razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body) // req.body is a raw buffer
      .digest('hex');

    if (signature !== expectedSignature) {
      console.log('❌ Invalid webhook signature');
      return res.status(400).send('Invalid signature');
    }

    const data = JSON.parse(req.body); // parse raw buffer
    const event = data.event;
    const paymentEntity = data.payload.payment.entity;
    const orderId = paymentEntity.order_id;

    const order = await Order.findOne({ orderId });
    if (!order) {
      console.log('Order not found for webhook');
      return res.status(404).send('Order not found');
    }

    const isDuplicate = order.paymentAttempts.some(p => p.paymentId === paymentEntity.id);
    if (isDuplicate) {
      return res.status(200).send('Already processed');
    }

    const attemptId = uuidv4();
    const status = event === 'payment.captured' ? 'Completed' : 'Failed';

    const paymentAttempt = {
      attemptId,
      paymentId: paymentEntity.id,
      status,
      razorpayResponse: paymentEntity,
      timestamp: new Date()
    };

    order.paymentStatus = status;
    if (status === 'Completed') order.paymentId = paymentEntity.id;
    order.paymentAttempts.push(paymentAttempt);

    await order.save();

    try {
      if (status === 'Completed') {
        await sendOrderConfirmationEmail(order, order.address.email);
      } else {
        await sendPaymentFailedEmail(order, order.address.email, paymentEntity.error_description || 'Payment failed');
      }
    } catch (err) {
      console.error('Webhook email error:', err);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Webhook failed');
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
    // Extract pagination parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Extract sorting parameters
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1; // Default to descending (newest first)
    const sort = { [sortBy]: sortOrder };

    // Build base query
    let query = Order.find();

    // Apply filters if provided
    if (req.query.paymentStatus) {
      query = query.where('paymentStatus', req.query.paymentStatus);
    }

    if (req.query.startDate && req.query.endDate) {
      query = query.where('createdAt').gte(new Date(req.query.startDate)).lte(new Date(req.query.endDate));
    }

    // Execute query with pagination and sorting
    const orders = await query
      .populate("products.productId", "productName currentPrice photographs") // Only select necessary product fields
      .populate("user", "name email") // Include basic user info
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(); // Convert to plain JS objects for better performance

    // Get total count (with same filters)
    const totalQuery = Order.find();
    if (req.query.paymentStatus) {
      totalQuery.where('paymentStatus', req.query.paymentStatus);
    }
    if (req.query.startDate && req.query.endDate) {
      totalQuery.where('createdAt').gte(new Date(req.query.startDate)).lte(new Date(req.query.endDate));
    }
    const totalOrders = await totalQuery.countDocuments();

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalOrders / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        totalItems: totalOrders,
        currentPage: page,
        pageSize: limit,
        totalPages,
        hasNext,
        hasPrev,
        nextPage: hasNext ? page + 1 : null,
        prevPage: hasPrev ? page - 1 : null,
      },
      sort: {
        by: sortBy,
        order: sortOrder === 1 ? 'asc' : 'desc'
      },
      filters: {
        paymentStatus: req.query.paymentStatus || 'none',
        dateRange: req.query.startDate && req.query.endDate 
          ? { start: req.query.startDate, end: req.query.endDate }
          : 'none'
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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