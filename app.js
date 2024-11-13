const express = require('express');
const cors = require("cors");
const app = express();
const ProductRout = require('./routes/ProductRout')
const userRout = require('./routes/userRoute')
const adminRout = require('./routes/adminRout')


app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('public'));
app.use(ProductRout)
app.use(userRout)
app.use(adminRout)
app.use((err, req, res, next) => {
    res.send(err.message);
});

app.get("/", (req, res) => {
    res.status(200).send("hello from the server !!")
})
module.exports = app; 
