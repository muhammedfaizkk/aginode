const express = require("express");
const { addProducts, deleteProduct, getAllproducts, getProduct , updateProduct} = require("../controllers/ProductController");
const upload = require("../middleware/fileUpload");

const router = express.Router();

router.route('/api/addproducts').post(upload.array("photographs", 4), addProducts);
router.route('/api/productsdelete/:id').delete(deleteProduct);
router.route('/api/getAllproducts').get(getAllproducts);
router.route('/api/getProduct/:id').get(getProduct);
router.route('/api/updateproduct/:id').put(upload.array("photographs", 4), updateProduct);

module.exports = router;
