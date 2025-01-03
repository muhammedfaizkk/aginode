
const express = require('express');
const {
    addCategory,
    addSubcategory,
    getCategories,
    deleteCategory,
} = require('../controllers/categoryController');

const router = express.Router();
router.post('/api/addCategory', addCategory);
router.post('/api/subcategories/:categoryId', addSubcategory);
router.get('/api/getCategories', getCategories);
router.delete('/api/deleteCategory/:id', deleteCategory);

module.exports = router;
