const jwt = require('jsonwebtoken');
const Users = require("../models/usersmodel");

const protectRoute = async (req, res, next) => {
    try {
        // Check for token in Authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!token) {
            return res.status(401).json({ message: 'No token provided, authorization denied' });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        if (!decoded || !decoded.id) {
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        // Find user and exclude sensitive fields
        const user = await Users.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Attach user to the request object
        req.user = user;

        // Proceed to the next middleware or controller
        next();
    } catch (error) {
        console.error('Token verification error:', error);

        // Handle token-specific errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired, please log in again' });
        }
        return res.status(401).json({ message: 'Invalid token, authorization denied' });
    }
};

module.exports = protectRoute;
