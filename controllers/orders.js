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
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay secret not configured');
  }

  const body = `${orderId}|${paymentId}`;
  return crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex') === signature;
};

exports.verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Validate required fields
    if (!orderId || !razorpayPaymentId || !razorpaySignature) {
      await session.abortTransaction();
      return res.status(400).json({
        message: 'Order ID, payment ID, and signature are required'
      });
    }

    const order = await Order.findOne({ orderId }).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus === 'Completed') {
      await session.abortTransaction();
      return res.status(200).json({
        success: true,
        message: 'Payment already completed'
      });
    }

    const isVerified = verifyRazorpaySignature(orderId, razorpayPaymentId, razorpaySignature);
    const paymentStatus = isVerified ? 'Completed' : 'Failed';

    order.paymentStatus = paymentStatus;
    order.paymentId = razorpayPaymentId;
    order.paymentDate = new Date();

    await order.save({ session });

    try {
      if (paymentStatus === 'Completed') {
        await sendOrderConfirmationEmail(order, order.address.email);
      } else {
        await sendPaymentFailedEmail(order, order.address.email);
      }
    } catch (emailErr) {
      console.error('Email error:', emailErr);
    }

    await session.commitTransaction();

    return res.status(isVerified ? 200 : 400).json({
      success: isVerified,
      message: isVerified ? 'Payment verified' : 'Payment failed',
      order
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Payment error:', error);
    return res.status(500).json({
      message: 'Payment processing error'
    });
  } finally {
    session.endSession();
  }
};

// Similar transaction improvements for webhook handler

exports.razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // Use raw body if available (configure this in your Express middleware)
    const rawBody = req.rawBody || req.body;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.log('❌ Invalid webhook signature');
      return res.status(400).send('Invalid signature');
    }

    const payload = JSON.parse(rawBody.toString());
    const event = payload.event;
    const paymentEntity = payload.payload.payment.entity;
    const orderId = paymentEntity.order_id;

    console.log(`✅ Processing webhook event: ${event} for order: ${orderId}`);

    // Validate we're handling a payment event
    if (!['payment.captured', 'payment.failed'].includes(event)) {
      console.log(`⚠️ Unhandled webhook event: ${event}`);
      return res.status(200).json({ status: 'unhandled_event' });
    }

    // Find and validate order
    const order = await Order.findOne({ orderId });
    if (!order) {
      console.log('❌ Order not found for webhook');
      return res.status(404).send('Order not found');
    }

    // Determine status
    const finalStatus = event === 'payment.captured' ? 'Completed' : 'Failed';

    // Update order
    order.paymentStatus = finalStatus;

    if (finalStatus === 'Completed') {
      order.paymentId = paymentEntity.id;
      order.paymentDate = new Date(); // Consistent with verifyPayment
    }

    try {
      await order.save();
    } catch (saveErr) {
      console.error('❌ Order save error:', saveErr);
      return res.status(500).send('Failed to update order');
    }

    // Send email notification
    try {
      if (finalStatus === 'Completed') {
        await sendOrderConfirmationEmail(order, order.address.email);
      } else {
        await sendPaymentFailedEmail(
          order,
          order.address.email,
          paymentEntity.error_description || 'Payment failed'
        );
      }
    } catch (emailErr) {
      console.error('❌ Email send error:', emailErr);
      // Continue despite email failure
    }

    res.status(200).json({ status: 'processed' });

  } catch (err) {
    console.error('❌ Webhook processing error:', err);
    res.status(500).send('Webhook processing failed');
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