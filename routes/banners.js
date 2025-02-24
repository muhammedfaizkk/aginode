const express = require('express');
const {upload} = require('../middleware/fileUpload')
const adminProtectRoute = require('../middleware/adminAuth')
const {
  createBanner,
  getBanners,
  updateBanner,
  deleteBanner,
} = require('../controllers/bannerController');

const router = express.Router();

router.route('/api/banners').post(upload.array('images',6),adminProtectRoute,createBanner);
router.route('/api/banners').get(adminProtectRoute,getBanners);
router.route('/api/banners/:bannerId').put(upload.array('images', 6),adminProtectRoute,updateBanner);
router.route('/api/banners/:bannerId').delete(adminProtectRoute,deleteBanner);

module.exports = router;
