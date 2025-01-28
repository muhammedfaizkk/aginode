const express = require("express");
const { signup, signin, getAllUsers, deleteAllUsers, deleteUser } = require("../controllers/usercontroller");

const router = express.Router();

router.route("/api/signup").post(signup);
router.route("/api/signin").post(signin);
router.get("/api/getusers", getAllUsers);
router.delete("/api/deleteusers", deleteAllUsers);
router.delete("/api/deleteusers/:id", deleteUser);

module.exports = router;
