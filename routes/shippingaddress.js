const express = require('express');
const {
    createShippingAddress,
    getAllShippingAddresses,
    getShippingAddressById,
    updateShippingAddress,
    deleteShippingAddress
} = require('../controllers/shippingAddress');

const router = express.Router();

router.post('/api/shipping-address', createShippingAddress);
router.get('/api/shipping-address', getAllShippingAddresses);
router.get('/api/shipping-address/:addressId', getShippingAddressById);
router.put('/api/shipping-address/:addressId', updateShippingAddress);
router.delete('/api/shipping-address/:addressId', deleteShippingAddress); 

module.exports = router;
