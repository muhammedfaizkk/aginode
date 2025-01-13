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
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await Users.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const secretKey = process.env.JWT_SECRET_KEY;
        const tokenExpiry = process.env.JWT_EXPIRY || "1d";

        if (!secretKey) {
            console.error("JWT_SECRET_KEY is not defined in environment variables");
            return res.status(500).json({ message: "Internal server configuration error" });
        }

        // Generate a JWT token
        const token = jwt.sign(
            {
                id: user._id,
                name: user.name,
                role: user.role,
            },
            secretKey,
            { expiresIn: tokenExpiry }
        );

        // Set token as an HttpOnly cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Use HTTPS in production
            sameSite: "strict", // Prevent CSRF
           maxAge: 30 * 24 * 60 * 60 * 1000, 
        });

        // Send response with user info and token
        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token, // Optional: send token in the body as well
        });
    } catch (error) {
        console.error("Error during sign-in:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


