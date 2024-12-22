const Users = require("../models/usersmodel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }
        const existingUserByEmail = await Users.findOne({ email });
        if (existingUserByEmail) {
            return res.status(400).json({ message: "User already exists with this email" });
        }
        const existingUserByname = await Users.findOne({ name });
        if (existingUserByname) {
            return res.status(400).json({ message: "Name already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new Users({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || 'user',
        });

        await user.save();
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role:user.role
            },
        });
    } catch (error) {
        console.error("Error during signup:", error); 
        res.status(500).json({
            message: "An unexpected error occurred",
            error: error.message,
            stack: error.stack,
        });
    }
};


exports.signin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

    
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        // Find the user by email
        const user = await Users.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Compare the password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate a JWT token
        const secretKey = process.env.JWT_SECRET_KEY;
        if (!secretKey) throw new Error("JWT_SECRET_KEY is not defined");

        const token = jwt.sign(
            { id: user._id, name: user.name },
            secretKey,
            { expiresIn: "1d" }
        );

        // Send token as a HttpOnly cookie (optional for better security)
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        // Return the response with user data and token
        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                name: user.name,
                _id: user._id,
                role: user.role,
                email: user.email,
            },
            token, // Include the token in the response body
        });
    } catch (error) {
        console.error("Error during signin:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


