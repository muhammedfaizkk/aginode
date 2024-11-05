const express = require("express");
const { addProducts ,deleteProduct,getAllproducts,getProduct,adminSignin} = require("../controllers/ProductController");
const upload = require("../middleware/fileUpload");

const router = express.Router();

router.route('/addproducts').post(upload.array("photographs", 4), addProducts);
router.route('/productsdelete/:id').delete(deleteProduct);
router.route('/getAllproducts').get(getAllproducts);
router.route('/getProduct/:id').get(getProduct);
router.route('/adminSignin').post(adminSignin);
module.exports = router;
