const mongoose = require("mongoose");

const databaseConnection = ()=>{
     mongoose.connect(process.env.DB_URI)
    .then((data) => console.log(`Database is connected with ${data.connection.host}`))
    .catch((err) => console.log(err.message))
}

module.exports = databaseConnection;