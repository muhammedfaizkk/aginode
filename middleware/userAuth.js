const jwt = require('jsonwebtoken'); 
const Users = require('../models/usersmodel'); 

const protectRoute = async (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, 'fijsdkJJFKKJfsfskkj'); 
        req.user = await Users.findById(decoded.userId);
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
