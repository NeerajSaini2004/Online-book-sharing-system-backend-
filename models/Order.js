const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Book Details
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  bookTitle: String,
  bookImage: String,
  
  // Buyer Details
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyerName: String,
  buyerEmail: String,
  deliveryAddress: {
    type: String,
    required: true
  },
  
  // Seller Details
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerName: String,
  
  // Order Details
  amount: {
    type: Number,
    required: true
  },
  
  // Payment Details
  paymentMethod: {
    type: String,
    enum: ['cod', 'online'],
    default: 'online'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Released'],
    default: 'Pending'
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  
  // Delivery Details
  deliveryStatus: {
    type: String,
    enum: ['Pending', 'Shipped', 'Out for Delivery', 'Delivered'],
    default: 'Pending'
  },
  trackingId: {
    type: String,
    unique: true
  },
  estimatedDeliveryDate: Date,
  actualDeliveryDate: Date,
  
  // Additional Info
  notes: String
}, { timestamps: true });

// Generate tracking ID before saving
orderSchema.pre('save', function(next) {
  if (!this.trackingId) {
    this.trackingId = 'TRK' + Math.floor(100000 + Math.random() * 900000);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
