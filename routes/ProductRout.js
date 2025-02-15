const express = require("express");
const {
    addProduct,
    deleteProduct,
    getAllProducts,
    getProductById,
    updateProduct
} = require("../controllers/ProductController");

const { upload, processImages } = require('../middleware/fileUpload'); // Correct import

const router = express.Router();

// ✅ Use upload.array() correctly
router.post('/api/addproducts', upload.array('photographs', 4), processImages, addProduct);
router.delete('/api/productsdelete/:id', deleteProduct);
router.get('/api/getAllproducts', getAllProducts);
router.get('/api/getProduct/:id', getProductById);
router.put('/api/updateproduct/:id', upload.array('photographs', 4), processImages, updateProduct);

module.exports = router;
