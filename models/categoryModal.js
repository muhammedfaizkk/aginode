
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  subcategories: {
    type: [String], // Array of subcategories as strings
    default: [],
  },
});

module.exports = mongoose.model('Category', categorySchema);
