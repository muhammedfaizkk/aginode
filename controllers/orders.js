const Order = require('../models/ordersmodel');
const ShippingAddress = require('../models/shippingAddmodel');
const Product = require('../models/ProudctModel'); // Assuming this is the correct product model
const { v4: uuidv4 } = require('uuid');


exports.createOrder = async (req, res) => {
    try {
        const { user, products, totalAmount, address } = req.body;

        if (!user || !products.length || !totalAmount || !address) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Validate the address object if it's passed directly in the request
        const { street, city, state, postalCode, phone, email } = address;
        if (!street || !city || !state || !postalCode || !phone || !email) {
            return res.status(400).json({ message: "Complete address details are required" });
        }

        // Validate email format
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // Validate phone number format (simple validation for example purposes)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ message: "Invalid phone number format" });
        }

        // Create a unique order ID
        const orderId = uuidv4();

        // Create the order
        const order = new Order({
            orderId,
            user,
            products,
            totalAmount,
            address, // Directly use the address from the request body
        });

        // Save the order to the database
        await order.save();

        // Send response
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
        // Retrieve all orders and populate user information
        const orders = await Order.find()
            .populate('user', 'name email'); // Populate user details (name, email)

        // For each order, fetch product details using productId stored in the products array
        const formattedOrders = await Promise.all(orders.map(async (order) => {
            const productsDetails = await Promise.all(order.products.map(async (item) => {
                // For each productId, find the product details from the Product model
                const product = await Product.findById(item.productId);

                if (product) {
                    return {
                        productName: product.productName,
                        price: product.price,
                        quantity: item.quantity,
                        totalPrice: item.quantity * product.price, // Calculate total price for each product
                    };
                } else {
                    return null; // In case the product is not found
                }
            }));

            return {
                orderId: order.orderId,
                user: order.user,
                products: productsDetails.filter(product => product !== null), // Filter out any null products (if any)
                totalAmount: order.totalAmount,
                address: order.address,
                status: order.status,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            };
        }));

        res.status(200).json({
            success: true,
            orders: formattedOrders, // Send the formatted order data with populated products
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
