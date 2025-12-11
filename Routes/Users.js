// routes/user.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/Users_Controller'); // Note the file name

// Route for registration
router.post('/signup', userController.signup);

// Route for login
router.post('/login', userController.login);

module.exports = router;