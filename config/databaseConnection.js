const mongoose = require("mongoose");

const databaseConnection = async () => {
  try {
    await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, 
      connectTimeoutMS: 5000,
    });
    console.log(`Database connected successfully`);
  } catch (err) {
    console.error(`Database connection error: ${err.message}`);
  }
};

module.exports = databaseConnection;
