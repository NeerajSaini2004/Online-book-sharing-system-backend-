const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/', orderController.createOrder);

// Specific named routes MUST come before /:id
router.get('/my-orders', orderController.getUserOrders);
router.get('/my-sales', orderController.getSellerOrders);
router.put('/ship/:id', orderController.markAsShipped);
router.put('/update-status/:id', orderController.updateDeliveryStatus);
router.put('/confirm/:id', orderController.confirmDelivery);

// Dynamic route LAST
router.get('/:id', orderController.getOrder);

module.exports = router;
