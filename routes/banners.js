const express = require('express');
const { upload, processImages } = require('../middleware/fileUpload');
const {
  createBanner,
  getBanners,
  updateBanner,
  deleteBanner,
} = require('../controllers/bannerController');

const router = express.Router();

router.post('/api/banners', upload.array('photographs', 6), processImages, createBanner);
router.route('/api/banners').get(getBanners);
router.route('/api/banners/:bannerId').put(upload.array('images', 6),processImages, updateBanner);
router.route('/api/banners/:bannerId').delete(deleteBanner);

module.exports = router;
