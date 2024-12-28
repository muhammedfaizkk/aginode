const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  images: [
    {
      type: String, 
      required: true,
    },
  ],
}, {
  timestamps: true,
});

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
