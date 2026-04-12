const Order = require('../models/Order');
const Listing = require('../models/Listing');

// Create order after successful payment
exports.createOrder = async (req, res) => {
  try {
    const {
      bookId,
      bookTitle,
      bookImage,
      buyerName,
      buyerEmail,
      deliveryAddress,
      amount,
      paymentMethod,
      razorpayOrderId,
      razorpayPaymentId,
      sellerId,
      sellerName
    } = req.body;

    // Set estimated delivery date (5 days from now)
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

    const order = new Order({
      bookId,
      bookTitle,
      bookImage,
      buyerId: req.user._id,
      buyerName,
      buyerEmail,
      deliveryAddress,
      sellerId,
      sellerName,
      amount,
      paymentMethod,
      paymentStatus: paymentMethod === 'online' ? 'Paid' : 'Pending',
      razorpayOrderId,
      razorpayPaymentId,
      deliveryStatus: 'Pending',
      estimatedDeliveryDate
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Get single order by ID
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('bookId', 'title author images')
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// Get buyer orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id })
      .populate('bookId', 'title author images')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get seller orders
exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.user._id })
      .populate('bookId', 'title author images')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Seller marks order as shipped
exports.markAsShipped = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is the seller
    if (order.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only seller can mark as shipped'
      });
    }

    if (order.deliveryStatus !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Order is already shipped'
      });
    }

    order.deliveryStatus = 'Shipped';
    await order.save();

    res.json({
      success: true,
      message: 'Order marked as shipped',
      data: order
    });
  } catch (error) {
    console.error('Mark as shipped error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryStatus, trackingId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const validStatuses = ['Pending', 'Shipped', 'Out for Delivery', 'Delivered'];
    if (!validStatuses.includes(deliveryStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid delivery status' });
    }

    order.deliveryStatus = deliveryStatus;
    if (trackingId) order.trackingId = trackingId;
    if (deliveryStatus === 'Delivered' && !order.actualDeliveryDate) {
      order.actualDeliveryDate = new Date();
    }
    await order.save();
    res.json({ success: true, message: 'Order updated', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Buyer confirms delivery and releases payment
exports.confirmDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is the buyer
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only buyer can confirm delivery'
      });
    }

    if (order.deliveryStatus !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Order must be delivered first'
      });
    }

    if (order.paymentStatus === 'Released') {
      return res.status(400).json({
        success: false,
        message: 'Payment already released'
      });
    }

    order.paymentStatus = 'Released';
    order.actualDeliveryDate = new Date();
    await order.save();

    res.json({
      success: true,
      message: 'Delivery confirmed and payment released to seller',
      data: order
    });
  } catch (error) {
    console.error('Confirm delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm delivery',
      error: error.message
    });
  }
};
