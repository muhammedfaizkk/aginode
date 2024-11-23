const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");



exports.signup = async (req, res) => {
    try {
        const { userName, email, password, role } = req.body;

        if (!userName || !email || !password) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            userName: userName.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || 'user', // Default role
        });
        await user.save();
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                userName: user.userName,
                email: user.email,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            const duplicateKey = Object.keys(error.keyValue)[0];
            return res.status(400).json({ message: `${duplicateKey} already exists` });
        }
        res.status(500).json({ message: error.message });
    }
};



exports.signin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }


        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password.." });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { id: user._id, userName: user.userName }, 
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1d" }
        );

        // Return the response
        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                userName: user.userName, 
                _id: user._id,
                role: user.role,
                email: user.email
            },
            token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

