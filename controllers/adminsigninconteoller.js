const Admin = require("../models/adminModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


exports.adminSignin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const existingAdmin = await Admin.findOne({ email });
        if (!existingAdmin) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, existingAdmin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: existingAdmin._id, userName: existingAdmin.userName },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.status(200).json({ success: true, message: "Logged in successfully", token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
