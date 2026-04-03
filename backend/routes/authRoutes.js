const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateUser, deleteUser, getUser, getUsers } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.patch('/update/:id', updateUser);
router.delete('/delete/:id', deleteUser);
router.get('/users', getUsers);
router.get('/user/:id', getUser);

module.exports = router;