const Users = require("../models/usersmodel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        // Trim username and check if it's empty
        const trimmedUsername = username.trim();
        if (!trimmedUsername) {
            return res.status(400).json({ message: "Username cannot be empty" });
        }

        // Check if the email already exists
        const existingUserByEmail = await Users.findOne({ email: email.toLowerCase() });
        if (existingUserByEmail) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        // Check if the username already exists
        const existingUserByUsername = await Users.findOne({ username: trimmedUsername });
        if (existingUserByUsername) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new Users({
            username: trimmedUsername,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || 'user', // Default to 'user' if no role is provided
        });

        // Save the user to the database
        await user.save();

        // Respond with success
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
        console.error("Error during signup:", error);

        res.status(500).json({
            message: "An unexpected error occurred",
            error: error.message,
            stack: error.stack, // Optional: for debugging purposes
        });
    }
};

exports.signin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email and password
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
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1d" }
        );

        // Return the response with user data and token
        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                username: user.username,
                _id: user._id,
                role: user.role,
                email: user.email,
            },
            token,
        });
    } catch (error) {
        console.error("Error during signin:", error);
        res.status(500).json({ message: error.message });
    }
};
