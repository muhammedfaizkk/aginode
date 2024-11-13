const express = require("express");
const { adminSignup } = require("../controllers/adminsigninconteoller");


const router = express.Router();
router.route('api/adminSignin').post(adminSignup);
module.exports = router;
