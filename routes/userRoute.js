const express = require("express");
const { signup, signin, getAllUsers, deleteAllUsers, deleteUser } = require("../controllers/usercontroller");

const router = express.Router();

router.route("/api/signup").post(signup);
router.route("/api/signin").post(signin);

router.get("/api/getusers", getAllUsers);

// Delete All Users
router.delete("/api/deleteusers", deleteAllUsers);

// Delete a Specific User
router.delete("/api/deleteusers/:id", deleteUser);

module.exports = router;
