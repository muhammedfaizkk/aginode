const express = require("express");
const { adminSignup, adminSignin, createAdmin, updateAdmin } = require("../controllers/adminsigninconteoller");

const router = express.Router();

router.post("/api/adminSignup", adminSignup);
router.post("/api/adminSignin", adminSignin);
router.post("/api/createAdmin", createAdmin);
router.put("/api/updateAdmin/:id", updateAdmin);

module.exports = router;
