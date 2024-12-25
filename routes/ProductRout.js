const express = require("express");
const { addProduct, deleteProduct, getAllProducts, getProductById, updateProduct } = require("../controllers/ProductController");  // Ensure the path and functions are correct
const upload = require("../middleware/fileUpload");

const router = express.Router();

// Define routes
router.route('/api/addproducts').post(upload.array("photographs", 4), addProduct);
router.route('/api/productsdelete/:id').delete(deleteProduct);
router.route('/api/getAllproducts').get(getAllProducts);
router.route('/api/getProduct/:id').get(getProductById);
router.route('/api/updateproduct/:id').put(upload.array("photographs", 4), updateProduct);

module.exports = router;
