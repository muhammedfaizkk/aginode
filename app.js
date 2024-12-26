const express = require('express');
const cors = require("cors");
const app = express();
const ProductRout = require('./routes/ProductRout')
const userRout = require('./routes/userRoute')
const adminRout = require('./routes/adminRout')
const ordersRoute = require('./routes/ordersRoute')
const cartRoute = require('./routes/cartRoute')
const shippingaddress = require('./routes/shippingaddress')
const favoriteRoutes = require('./routes/favoriteRoutes')
const path = require('path');

require('dotenv').config();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/products', ProductRout);
app.use('/api/users', userRout);
app.use('/api/admin', adminRout);
app.use('/api/orders', ordersRoute);
app.use('/api/cart', cartRoute);
app.use('/api/shipping', shippingaddress);
app.use('/api/favorites', favoriteRoutes);


app.use((err, req, res, next) => {
    res.send(err.message);
});

app.get("/", (req, res) => {
    res.status(200).send("hello from the server !!")
})
module.exports = app; 
