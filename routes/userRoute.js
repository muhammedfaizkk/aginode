const express = require("express");
const { signup, signin } = require("../controllers/usercontroller");

const router = express.Router();

router.route("/api/signup").post(signup);
router.route("/api/signin").post(signin);

module.exports = router;
