const Banner = require('../models/bannerModals');
const fs = require('fs');
const path = require('path');

exports.createBanner = async (req, res) => {
  try {
    const { title } = req.body;
    const images = req.files.map((file) => file.path);

    if (images.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    // Create a new banner
    const newBanner = new Banner({
      title,
      images, 
    });

    await newBanner.save();
    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      banner: newBanner,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get all banners
exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find();
    if (banners.length === 0) {
      return res.status(404).json({ success: false, message: 'No banners found' });
    }
    res.status(200).json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a banner by its ID
exports.updateBanner = async (req, res) => {
  try {
    const bannerId = req.params.bannerId;
    const { title } = req.body;
    const image = req.file ? req.file.path : undefined; // Get the image path from the file

    const updatedBanner = await Banner.findByIdAndUpdate(bannerId, { title, image }, { new: true });

    if (!updatedBanner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      banner: updatedBanner,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.deleteBanner = async (req, res) => {
  try {
    const bannerId = req.params.bannerId;
    const banner = await Banner.findById(bannerId);

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    if (Array.isArray(banner.images)) {
      banner.images.forEach((imagePath) => {
        const resolvedPath = path.resolve(imagePath); // Resolve the full path
        fs.unlink(resolvedPath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${resolvedPath}`, err);
          }
        });
      });
    }

    // Delete the banner from the database
    await banner.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Banner and associated images deleted successfully',
      banner,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
