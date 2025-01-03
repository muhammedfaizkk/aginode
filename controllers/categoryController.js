
const Category = require('../models/categoryModal')


exports.addCategory = async (req, res) => {
    try {
        const { category, subcategories } = req.body;

        const newCategory = new Category({
            category,
            subcategories,
        });

        await newCategory.save();
        res.status(201).json({ message: 'Category added successfully', newCategory });
    } catch (error) {
        res.status(500).json({ error: 'Error adding category', details: error.message });
    }
};



exports.addSubcategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { subcategory } = req.body;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        if (!category.subcategories.includes(subcategory)) {
            category.subcategories.push(subcategory);
            await category.save();
        }

        res.status(200).json({ message: 'Subcategory added successfully', category });
    } catch (error) {
        res.status(500).json({ error: 'Error adding subcategory', details: error.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving categories', details: error.message });
    }
};


exports.deleteCategory = async (req, res) => {
    try {
      const { id } = req.params;
      await Category.findByIdAndDelete(id);
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting category', details: error.message });
    }
  };
  