const jwt = require('jsonwebtoken');
const Users = require('../models/usersmodel');
const mongoose = require('mongoose');

const protectRoute = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!token) {
            return res.status(401).json({ message: 'No token provided, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        if (!decoded || !decoded.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        // Fetch user from DB
        const user = await Users.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(403).json({ message: 'User not found, access forbidden' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error.name);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Token expired, please log in again',
                expiredAt: error.expiredAt,
            });
        }

        return res.status(401).json({ message: 'Invalid token, authorization denied' });
    }
};

module.exports = protectRoute;
