const express = require('express');
const { register, login, googleLogin, forgotPassword, resetPassword, sendOTP, resetPasswordDirect, sendVerificationOTP, verifyAndRegister } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.post('/send-otp', sendOTP);
router.post('/reset-password-direct', resetPasswordDirect);
router.post('/send-verification-otp', sendVerificationOTP);
router.post('/verify-and-register', verifyAndRegister);

module.exports = router;