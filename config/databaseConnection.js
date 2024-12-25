const mongoose = require('mongoose');

const databaseConnection = () => {
  mongoose.connect(process.env.DB_URI, {
    serverSelectionTimeoutMS: 5000,  // Increase the timeout as needed
    connectTimeoutMS: 10000,         // Increase the connection timeout
  })
  .then((data) => {
    console.log(`Database is connected with ${data.connection.host}`);
  })
  .catch((err) => {
    console.log(`Database connection error: ${err.message}`);
  });
};

module.exports = databaseConnection;
