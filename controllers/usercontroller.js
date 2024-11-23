const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        // Ensure that username is not null or empty
        if (!username.trim()) {
            return res.status(400).json({ message: "Username cannot be empty" });
        }

        // Check if the user already exists by email
        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        // Check if the user already exists by username
        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new User({
            username: username.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || 'user',
        });

        // Save the user
        await user.save();

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        // Log the error for debugging
        console.error("Error during signup:", error);

        // Return detailed error message
        res.status(500).json({
            message: "An unexpected error occurred",
            error: error.message,  // Return the error message for debugging
            stack: error.stack,    // Optional: include the stack trace for debugging
        });
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
            { id: user._id, username: user.username }, 
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1d" }
        );

        // Return the response
        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                username: user.username, 
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

