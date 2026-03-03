const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Create order after payment
router.post('/', orderController.createOrder);

// Get single order
router.get('/:id', orderController.getOrder);

// Get all orders for logged-in user
router.get('/user/all', orderController.getUserOrders);

// Seller marks as shipped
router.put('/ship/:id', orderController.markAsShipped);

// Update delivery status (admin/delivery partner)
router.put('/update-status/:id', orderController.updateDeliveryStatus);

// Buyer confirms delivery
router.put('/confirm/:id', orderController.confirmDelivery);

module.exports = router;
