const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Admin = require("../models/adminModel");

// Admin Signup
exports.adminSignup = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new Admin({
            email,
            password: hashedPassword,
            role: "admin",
        });

        await newAdmin.save();

        const token = jwt.sign(
            { id: newAdmin._id, email: newAdmin.email, role: "admin" },
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
            { id: existingAdmin._id, email: existingAdmin.email, role: "admin" },
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

// Update Admin
exports.updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, password } = req.body;

        const updateData = {};
        if (email) updateData.email = email;
        if (password) updateData.password = await bcrypt.hash(password, 10);

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

// Delete Admin
exports.deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prevent self-deletion
        if (req.user.id === id) {
            return res.status(403).json({ message: "You cannot delete your own account" });
        }

        const deletedAdmin = await Admin.findByIdAndDelete(id);
        if (!deletedAdmin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.status(200).json({
            success: true,
            message: "Admin deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
