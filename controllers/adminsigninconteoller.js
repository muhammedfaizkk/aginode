const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Admin = require("../models/adminModel");


exports.adminSignup = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin with this email already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new admin
        const newAdmin = new Admin({
            email,
            password: hashedPassword,
            role: role || "admin", // Default role is 'admin'
        });

        await newAdmin.save();

        // Generate a token
        const token = jwt.sign(
            { id: newAdmin._id, email: newAdmin.email },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.status(201).json({
            success: true,
            message: "Admin signed up successfully",
            token,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin Signin
exports.adminSignin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const existingAdmin = await Admin.findOne({ email });
        if (!existingAdmin) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, existingAdmin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: existingAdmin._id, email: existingAdmin.email },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create Admin
exports.createAdmin = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new Admin({
            email,
            password: hashedPassword,
            role,
        });

        await newAdmin.save();

        res.status(201).json({
            success: true,
            message: "Admin created successfully",
            admin: {
                id: newAdmin._id,
                email: newAdmin.email,
                role: newAdmin.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Admin
exports.updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, password, role } = req.body;

        const updateData = {};
        if (email) updateData.email = email;
        if (password) updateData.password = await bcrypt.hash(password, 10);
        if (role) updateData.role = role;

        const updatedAdmin = await Admin.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedAdmin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            admin: {
                id: updatedAdmin._id,
                email: updatedAdmin.email,
                role: updatedAdmin.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
