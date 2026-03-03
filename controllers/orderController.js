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

// Get all orders for a user (buyer or seller)
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { role } = req.query; // 'buyer' or 'seller'

    let query = {};
    if (role === 'seller') {
      query.sellerId = userId;
    } else {
      query.buyerId = userId;
    }

    const orders = await Order.find(query)
      .populate('bookId', 'title author images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
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

// Update delivery status (for admin/delivery partner)
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const validStatuses = ['Pending', 'Shipped', 'Out for Delivery', 'Delivered'];
    if (!validStatuses.includes(deliveryStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery status'
      });
    }

    order.deliveryStatus = deliveryStatus;
    
    // Set actual delivery date when delivered
    if (deliveryStatus === 'Delivered' && !order.actualDeliveryDate) {
      order.actualDeliveryDate = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Delivery status updated',
      data: order
    });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
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
