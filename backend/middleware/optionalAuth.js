const jwt = require('jsonwebtoken');
const User = require('../models/User');

const optionalProtect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get the token from the header
            token = req.headers.authorization.split(' ')[1];

            // Verify the token with secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch User from db without password
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            console.warn('Optional Auth failed, proceeding as guest');
        }
    }

    next();
};

module.exports = { optionalProtect };
