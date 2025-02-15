const express = require('express');
const upload = require('../middleware/fileUpload')
const {
  createBanner,
  getBanners,
  updateBanner,
  deleteBanner,
} = require('../controllers/bannerController');

const router = express.Router();

router.route('/api/banners').post(upload.array('images',6), createBanner);
router.route('/api/banners').get(getBanners);
router.route('/api/banners/:bannerId').put(upload.array('images', 6), updateBanner);
router.route('/api/banners/:bannerId').delete(deleteBanner);

module.exports = router;
