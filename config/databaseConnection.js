const mongoose = require("mongoose");

const databaseConnection = async () => {
  try {
    const connection = await mongoose.connect(process.env.DB_URI, {
      serverSelectionTimeoutMS: 50000, // 50 seconds
      connectTimeoutMS: 50000,         // 50 seconds
    });
    console.log(`Database is connected with ${connection.connection.host}`);
  } catch (err) {
    console.error(`Database connection error: ${err.message}`);
  }
};

module.exports = databaseConnection;
