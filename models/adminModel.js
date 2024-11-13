const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Please enter an email address"],
        unique: true, // Ensure the email is unique
        match: [/\S+@\S+\.\S+/, "Please provide a valid email address"] // Email format validation
    },
    password: {
        type: String,
        required: [true, "Please enter a password"],
        minLength: [6, "Password should be at least 6 characters!"]
    },
    role: {
        type: String,
        default: 'admin' // Default role is admin
    }

}, { timestamps: true });


module.exports = mongoose.model('Admin', adminSchema);
