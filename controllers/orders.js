const Order = require('../models/ordersmodel');


exports.createOrder = async (req, res) => {
    try {
        const { user, products, totalAmount, shippingAddress, contactNumber } = req.body;

        if (!user || !products || !totalAmount || !shippingAddress || !contactNumber) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const order = new Order({
            user,
            products,
            totalAmount,
            shippingAddress,
            contactNumber,
        });

        await order.save();

        res.status(201).json({
            success: true,
            message: "Order created successfully",
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

        // Update the status of the order
        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true } // Return the updated document
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



exports.deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findByIdAndDelete(orderId);
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

// Get all orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'username email').populate('products.productId', 'productName price');
        res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('user', 'username email')
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
