const Order = require('../models/ordersmodel');
const ShippingAddress = require('../models/shippingAddmodel');
const Product = require('../models/ProudctModel'); // Assuming this is the correct product model
const { v4: uuidv4 } = require('uuid');


exports.createOrder = async (req, res) => {
    try {
        const { user, products, totalAmount, addressId } = req.body;

        if (!user || !products.length || !totalAmount || !addressId) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const addressExists = await ShippingAddress.findById(addressId);
        if (!addressExists) {
            return res.status(404).json({ message: "Address not found" });
        }

        for (const product of products) {
            const productExists = await Product.findById(product.productId);
            if (!productExists) {
                return res.status(404).json({ message: `Product with ID ${product.productId} not found` });
            }
            if (product.quantity > productExists.stock) {
                return res.status(400).json({ message: `Insufficient stock for ${productExists.productName}` });
            }
        }

        const orderId = uuidv4();
        const order = new Order({
            orderId,
            user,
            products,
            totalAmount,
            addressId,
        });

        await order.save();

        for (const product of products) {
            await Product.findByIdAndUpdate(product.productId, {
                $inc: { stock: -product.quantity }
            });
        }

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Order Status
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

        const order = await Order.findOneAndUpdate(
            { orderId },
            { status },
            { new: true }
        );

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

// Delete Order
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

// Get All Orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('products.productId', 'productName price');
        res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Order By ID
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
