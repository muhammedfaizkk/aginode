const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

const { razorpayWebhook } = require('./controllers/orders');
const ProductRout = require('./routes/ProductRout');
const userRout = require('./routes/userRoute');
const adminRout = require('./routes/adminRout');
const ordersRoute = require('./routes/ordersRoute');
const cartRoute = require('./routes/cartRoute');
const shippingaddress = require('./routes/shippingaddress');
const favoriteRoutes = require('./routes/favoriteRoutes');
const banners = require('./routes/banners');
const categoryRoute = require('./routes/categoryRoute');

// ✅ STATIC FILES
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ SECURE CORS SETUP for multiple frontends
const allowedOrigins = [
  'https://autogridnumberplate.com',
  'https://admin.autogridnumberplate.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ✅ Handle preflight requests

// ✅ WEBHOOK MUST COME BEFORE global body parsers
app.post(
  '/api/webhook',
  express.raw({ type: 'application/json' }), // ✅ Use raw body for signature verification
  razorpayWebhook
);

// ✅ Global body parsers for normal routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ ROUTES MOUNTING
app.use(ProductRout);
app.use(userRout);
app.use(adminRout);
app.use(ordersRoute); // <-- make sure your router does NOT include the webhook here!
app.use(cartRoute);
app.use(shippingaddress);
app.use(favoriteRoutes);
app.use(banners);
app.use(categoryRoute);

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.status(200).send("Hello from the server!");
});

// ✅ ERROR HANDLER
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message });
});

// ✅ EXPORT APP
module.exports = app;
