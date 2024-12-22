const jwt = require('jsonwebtoken');
const Users = require("../models/usersmodel");

const protectRoute = async (req, res, next) => {

    const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    try {
        // Verify token using JWT_SECRET_KEY from environment variables
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); 
        
        // Find user using the id from the decoded token
        req.user = await Users.findById(decoded.id);
        if (!req.user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Proceed to the next middleware/controller
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = protectRoute;
