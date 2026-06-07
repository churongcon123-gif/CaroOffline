const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authController.getProfile);
router.put('/change-password', authController.changePassword);
router.put('/change-avatar', authController.changeAvatar);

module.exports = router;

