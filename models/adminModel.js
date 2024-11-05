const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: [true, "Please enter user name"],
        minLength: [3, "User name should have a minimum of 3 characters!"],
        maxLength: [50, "User name shouldn't exceed 50 characters"]
    },
    password: {
        type: String,
        required: [true, "Please enter a password"]
    }
});



module.exports = mongoose.model('Admin', adminSchema);
