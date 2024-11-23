const jwt = require('jsonwebtoken'); 
const User = require('../models/userModel'); 

const protectRoute = async (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        req.user = await User.findById(decoded.userId);
        if (!req.user) {
            return res.status(404).json({ message: 'User not found' });
        }
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = protectRoute;
