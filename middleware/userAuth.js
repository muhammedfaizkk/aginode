const jwt = require('jsonwebtoken');
const Users = require("../models/usersmodel");

const protectRoute = async (req, res, next) => {
    // Check for token in Authorization header (Bearer <token>)
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    try {
        // Verify the token and decode its payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // Find the user by decoded ID
        req.user = await Users.findById(decoded.id);
        if (!req.user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Proceed to next middleware or controller
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        
        // Handle expired or invalid tokens
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired, please log in again' });
        }

        // Default error message for invalid token
        res.status(401).json({ message: 'Invalid token, authorization denied' });
    }
};

module.exports = protectRoute;
