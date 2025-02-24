const express = require("express");
const { addProduct, deleteProduct, getAllProducts, getProductById, updateProduct } = require("../controllers/ProductController");  // Ensure the path and functions are correct
const {upload} = require("../middleware/fileUpload");
const adminProtectRoute = require('../middleware/adminAuth')

const router = express.Router();

router.post('/api/addproducts', upload.array('photographs', 4),adminProtectRoute,addProduct);
router.route('/api/productsdelete/:id').delete(adminProtectRoute,deleteProduct);
router.route('/api/getAllproducts').get(getAllProducts);
router.route('/api/getProduct/:id').get(getProductById);
router.route('/api/updateproduct/:id').put(upload.array("photographs", 4),adminProtectRoute,updateProduct);

module.exports = router;
