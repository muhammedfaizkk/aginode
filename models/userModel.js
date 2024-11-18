const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: [true, "Please provide a username"],
        unique: true,
        minLength: [3, "Username should have a minimum of 3 characters"],
        maxLength: [50, "Username shouldn't exceed 50 characters"]
    },
    email: {
        type: String,
        required: [true, "Please provide an email"],
        unique: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        minLength: [6, "Password should be at least 6 characters long"]
    },
    role: {
        type: String,
        enum: ["user", "admin"], // Only allows "user" or "admin" as roles
        default: "user"
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
