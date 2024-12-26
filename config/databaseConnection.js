const mongoose = require('mongoose');

const databaseConnection = () => {
    const uri = process.env.DB_URI;

    if (!uri) {
        console.error('Database URI is missing. Please check your .env file.');
        return;
    }

    const options = {
        // Optional: Add only relevant options for your use case
        serverSelectionTimeoutMS: 15000, // Timeout after 15 seconds if no server is found
        socketTimeoutMS: 20000,         // Close sockets after 20 seconds of inactivity
    };

    mongoose.connect(uri, options)
        .then((data) => {
            console.log(`Database connected with host: ${data.connection.host}`);
        })
        .catch((err) => {
            console.error('Database connection error:', err);
        });

    mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('Mongoose connection lost. Retrying...');
        mongoose.connect(uri, options).catch((err) => console.error('Retry failed:', err));
    });
};

module.exports = databaseConnection;
