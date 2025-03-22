const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const mongoose = require('mongoose');

const adminProtectRoute = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!token) {
            return res.status(401).json({ message: 'No token provided, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        if (!decoded || !decoded.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin) {
            return res.status(403).json({ message: 'Admin not found, access forbidden' });
        }

        if (admin.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied, admin only' });
        }

        req.user = admin;
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

module.exports = adminProtectRoute;
