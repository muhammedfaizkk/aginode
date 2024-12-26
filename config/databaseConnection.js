const mongoose = require('mongoose');

const databaseConnection = async () => {
  const uri = process.env.DB_URI;

  if (!uri) {
    console.error('Database URI is missing. Please check your .env file.');
    return;
  }

  const options = {
    serverSelectionTimeoutMS: 15000,  // Timeout after 15 seconds if no server is found
    socketTimeoutMS: 20000,           // Close sockets after 20 seconds of inactivity
  };

  const connectWithRetry = async () => {
    try {
      await mongoose.connect(uri, options);
      console.log('Database connected successfully');
    } catch (err) {
      console.error('Database connection error:', err);
      setTimeout(connectWithRetry, 5000);  // Retry after 5 seconds
    }
  };

  connectWithRetry();
};

module.exports = databaseConnection;
