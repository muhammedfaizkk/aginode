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

router.route('/api/createorder').post(protectRoute,createOrder)
router.route('/api/updateorder/:orderId').put(protectRoute,updateOrderStatus)
router.route('/api/deleteorde/:orderId').post(protectRoute,deleteOrder)
router.route('/api/getAllorders').get(protectRoute,getAllOrders)
router.route('/api/getAllorders/:orderId').get(protectRoute,getOrderById)


module.exports = router;
