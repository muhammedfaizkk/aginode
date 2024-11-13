const express = require("express");
const { adminSignin } = require("../controllers/adminsigninconteoller");


const router = express.Router();
router.route('/api/adminSignin').post(adminSignin);

module.exports = router;
