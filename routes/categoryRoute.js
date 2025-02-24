
const express = require('express');
const {
    addCategory,
    addSubcategory,
    getCategories,
    deleteCategory,
} = require('../controllers/categoryController');
const adminProtectRoute = require('../middleware/adminAuth')

const router = express.Router();
router.post('/api/addCategory', adminProtectRoute,addCategory);
router.post('/api/subcategories/:categoryId',adminProtectRoute, addSubcategory);
router.get('/api/getCategories', getCategories);
router.delete('/api/deleteCategory/:id',adminProtectRoute,deleteCategory);

module.exports = router;
