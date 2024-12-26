const mongoose = require("mongoose");

const databaseConnection = () => {
    mongoose.connect(process.env.DB_URI, {
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000,  
    })
    .then((data) => {
        console.log(`Database is connected with host: ${data.connection.host}, port: ${data.connection.port}`);
    })
    .catch((err) => {
        console.log('Database connection error:', err.message);
    });
};

module.exports = databaseConnection;
