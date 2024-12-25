const express = require("express");
const { adminSignup, adminSignin, updateAdmin, deleteAdmin } = require("../controllers/adminsigninconteoller");

const router = express.Router();


router.post("/api/adminSignup", adminSignup);
router.post("/api/adminSignin", adminSignin);
router.put("/api/updateAdmin/:id", updateAdmin);
router.delete("/api/deleteAdmin/:id", deleteAdmin);

module.exports = router;
