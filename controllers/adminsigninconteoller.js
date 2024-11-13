const Admin = require("../models/adminModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Admin Signup
exports.adminSignup = async (req, res, next) => {
    try {
        const { userName, password } = req.body;

        if (!userName || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ userName });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin already exists with this username" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the admin
        const newAdmin = await Admin.create({
            userName,
            password: hashedPassword
        });

        res.status(201).json({ success: true, message: "Admin registered successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin Signin
exports.adminSignin = async (req, res, next) => {
    try {
        const { userName, password } = req.body;

        if (!userName || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        // Check if admin exists
        const existingAdmin = await Admin.findOne({ userName });
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
