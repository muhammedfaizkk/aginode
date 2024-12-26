const mongoose = require('mongoose');

// Set up the database connection
const databaseConnection = () => {
    // Ensure the DB_URI is set in the .env file
    if (!process.env.DB_URI) {
        console.error('Database URI is missing. Please check your .env file.');
        return;
    }

    // MongoDB connection options (no need for deprecated options)
    const options = {
        connectTimeoutMS: 10000,  // Connection timeout in milliseconds
        socketTimeoutMS: 10000,   // Socket timeout in milliseconds
    };

    mongoose.connect(process.env.DB_URI, options)
        .then((data) => {
            console.log(`Database connected with host: ${data.connection.host}`);
        })
        .catch((err) => {
            console.error('Database connection error:', err.message);
        });
};

module.exports = databaseConnection;
