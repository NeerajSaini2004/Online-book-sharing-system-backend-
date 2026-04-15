const express = require('express');
const { register, login, googleLogin, forgotPassword, resetPassword, sendOTP, resetPasswordDirect } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.post('/send-otp', sendOTP);
router.post('/reset-password-direct', resetPasswordDirect);

module.exports = router;