const express = require("express");
const { addProducts ,deleteProduct,getAllproducts,getProduct} = require("../controllers/ProductController");
const upload = require("../middleware/fileUpload");

const router = express.Router();

router.route('/api/addproducts').post(upload.array("photographs", 4), addProducts);
router.route('/api/productsdelete/:id').delete(deleteProduct);
router.route('/api/getAllproducts').get(getAllproducts);
router.route('/api/getProduct/:id').get(getProduct);

module.exports = router;
