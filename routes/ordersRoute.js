const express = require('express');
const router = express.Router();
const {
    createOrder,
    updateOrderStatus,
    deleteOrder,
    getAllOrders,
    getOrderById,
} = require('../controllers/orders');
const protectRoute = require('../middleware/userAuth');

router.route('/api/createorder').post(createOrder)
router.route('/api/deleteorde/:orderId').delete(deleteOrder)
router.route('/api/getAllorders').get(getAllOrders)
router.route('/api/getAllorders/:orderId').get(getOrderById)
router.route('/api/updateorder/:orderId').put(updateOrderStatus)


module.exports = router;
