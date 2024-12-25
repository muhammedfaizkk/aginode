const mongoose = require("mongoose");

const databaseConnection = () => {
    mongoose.connect(process.env.DB_URI, {
        useNewUrlParser: true,    // Ensures the use of the new URL parser
        useUnifiedTopology: true, // Ensures the use of the new server discovery and monitoring engine
    })
    .then((data) => {
        console.log(`Database is connected with ${data.connection.host}`);
    })
    .catch((err) => {
        console.error("Database connection error:", err.message);
        process.exit(1); // Exit the process if the database connection fails
    });
};

module.exports = databaseConnection;
