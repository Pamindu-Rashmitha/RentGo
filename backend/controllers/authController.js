const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        if (name.trim().length < 2) {
            return res.status(400).json({ message: 'Name must be at least 2 characters' });
        }

        if (/^\d+$/.test(name.trim())) {
            return res.status(400).json({ message: 'Name cannot contain only numbers' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please include a valid email address' });
        }

        // Check user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // Hash passwords
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'user'

        });

        // Success Message
        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
                message: 'User registered successfully!'
            });

        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');

        res.status(200).json(users)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        // Check User exists
        const user = await User.findOne({ email });

        // Check password matches hashed password
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid Credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateUser = async (req, res) => {

    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.body.name) {
            if (/^\d+$/.test(req.body.name.trim())) {
                return res.status(400).json({ message: 'Name cannot contain only numbers' });
            }
            if (req.body.name.trim().length < 2) {
                return res.status(400).json({ message: 'Name must be at least 2 characters' });
            }
            user.name = req.body.name;
        }
        if (req.body.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(req.body.email)) {
                return res.status(400).json({ message: 'Please include a valid email address' });
            }
            user.email = req.body.email;
        }
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();
        res.status(200).json({
            message: 'User updated successfully!',
            user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


module.exports = {
    registerUser,
    loginUser,
    updateUser,
    deleteUser,
    getUser,
    getUsers
};