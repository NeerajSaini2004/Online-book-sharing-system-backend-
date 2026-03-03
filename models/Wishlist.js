const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listings: [{
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    priceAlert: {
      enabled: { type: Boolean, default: false },
      targetPrice: Number
    }
  }]
}, {
  timestamps: true
});

// Ensure one wishlist per user
wishlistSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);