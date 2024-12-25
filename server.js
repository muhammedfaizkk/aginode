const dotenv = require("dotenv");
const app = require("./app");
const databaseConnection = require("./config/databaseConnection");

dotenv.config({ path: './config/.env' });
const PORT = process.env.PORT || 5001; 
databaseConnection();

app.listen(PORT, () => {
    console.log("Server is running on port", PORT);
});
