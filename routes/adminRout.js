const express = require("express");
const { adminSignup, adminSignin, updateAdmin, deleteAdmin } = require("../controllers/adminsigninconteoller");

const router = express.Router();

// Use route chaining for consistency
router.route("/api/adminSignup").post(adminSignup);
router.route("/api/adminSignin").post(adminSignin);
router.route("/api/updateAdmin/:id").put(updateAdmin);
router.route("/api/deleteAdmin/:id").delete(deleteAdmin);

module.exports = router;
