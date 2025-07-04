const express = require('express');
const router = express.Router();
const {
    createOrder,
    updateOrderStatus,
    getAllOrders,
    getOrderById,
    verifyPayment,
    deleteOrderAdmin,
    deleteOrderUser,
    deleteAllOrders,
    getOrdersByUserId,
    razorpayWebhook,
} = require('../controllers/orders');
const protectRoute = require('../middleware/userAuth');

// Your existing routes
router.route('/api/createorder').post(createOrder);
router.route('/api/getAllorders').get(getAllOrders);
router.route('/api/getAllorders/:orderId').get(getOrderById);
router.route('/api/getOrdersByUserId').get(protectRoute, getOrdersByUserId);
router.route('/api/updateorder/:orderId').put(updateOrderStatus);
router.route('/api/verifyPayment').post(verifyPayment);
router.route('/api/deleteOrderAdmin/:orderId').delete(deleteOrderAdmin);
router.route('/api/deleteOrderUser/:orderId').delete(protectRoute, deleteOrderUser);
router.route('/api/deleteallorders').delete(deleteAllOrders);


router.post(
  '/api/webhook',
  express.json({
    verify: (req, res, buf) => { req.rawBody = buf; },
  }),
  razorpayWebhook
);

module.exports = router;
