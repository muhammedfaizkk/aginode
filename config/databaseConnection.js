const mongoose = require("mongoose");

const databaseConnection = () => {
    mongoose.connect(process.env.DB_URI, {
        connectTimeoutMS: 30000,  
        socketTimeoutMS: 30000,  
    })
    .then((data) => {
        console.log(`Database connected successfully: ${data.connection.host}:${data.connection.port}`);
    })
    .catch((err) => {
        console.error('Database connection error:', err.message);
    });
};

module.exports = databaseConnection;
