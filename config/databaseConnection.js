const mongoose = require('mongoose');

// Event listeners for connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to the database');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from the database');
});

// Database connection function using async/await
const databaseConnection = async () => {
  const uri = process.env.DB_URI;

  if (!uri) {
    console.error('Database URI is missing. Please check your .env file.');
    return;
  }

  const options = {
    serverSelectionTimeoutMS: 15000, // Timeout after 15 seconds if no server is found
    socketTimeoutMS: 20000,         // Close sockets after 20 seconds of inactivity
  };

  try {
    await mongoose.connect(uri, options); // Connect to the database
    console.log('Database connected successfully',uri);
  } catch (err) {
    console.error('Database connection error:', err); // Handle any connection errors
  }

  // Handling automatic reconnection if the connection is lost
  mongoose.connection.on('disconnected', async () => {
    console.warn('Mongoose connection lost. Retrying...');
    try {
      await mongoose.connect(uri, options);  // Retry the connection
      console.log('Reconnected to the database');
    } catch (err) {
      console.error('Retry failed:', err);  // Handle retry failure
    }
  });
};

module.exports = databaseConnection;
