const express = require('express');
const upload = require('../middleware/fileUpload')
const {
  createBanner,
  getBanners,
  updateBanner,
  deleteBanner,
} = require('../controllers/bannerController');

const router = express.Router();

router.route('/api/banners').post(upload.array('images', 5), createBanner);
router.route('/api/banners').get(getBanners);
router.route('/api/banners/:bannerId').put(upload.array('image', 5), updateBanner);
router.route('/api/banners/:bannerId').delete(deleteBanner);

module.exports = router;
