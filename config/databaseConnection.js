const mongoose = require('mongoose');

const databaseConnection = () => {
    if (!process.env.DB_URI) {
        console.error('Database URI is missing. Please check your .env file.');
        return;
    }

    const options = {
        // Optional: Mongoose sets these by default, but you can leave them here if needed
        connectTimeoutMS: 10000, 
        socketTimeoutMS: 10000,
    };

    mongoose.connect(process.env.DB_URI, options)
        .then((data) => {
            console.log(`Database connected with host: ${data.connection.host}`);
        })
        .catch((err) => {
            console.error('Database connection error:', err);  // Log the full error
        });
};

module.exports = databaseConnection;
