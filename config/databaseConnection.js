const mongoose = require("mongoose");

const databaseConnection = () => {
  mongoose.connect(process.env.DB_URI, {
    serverSelectionTimeoutMS: 50000, // 15 seconds
    connectTimeoutMS: 50000,         // 15 seconds
    useNewUrlParser: true,           // Use the new parser (although deprecated, still supported for now)
    useUnifiedTopology: true        // Use the new topology engine
  })
  .then((data) => {
    console.log(`Database is connected with ${data.connection.host}`);
  })
  .catch((err) => {
    console.log(`Database connection error: ${err.message}`);
  });
};

module.exports = databaseConnection;
