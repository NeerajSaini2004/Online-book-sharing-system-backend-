const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createOrder, verifyPayment } = require('../controllers/paymentController');

// Remove auth temporarily for testing
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

module.exports = router;
