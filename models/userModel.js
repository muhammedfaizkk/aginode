const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'username is required'],
        unique: true, 
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true, // Ensure uniqueness
        lowercase: true, // Automatically convert to lowercase
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'], // Optional password validation
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin'], // Define acceptable roles
    },
}, { timestamps: true }); // Add createdAt and updatedAt fields automatically

module.exports = mongoose.model('User', userSchema);
