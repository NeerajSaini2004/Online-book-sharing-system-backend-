const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true
  },
  isbn: {
    type: String,
    sparse: true
  },
  edition: String,
  price: {
    type: Number,
    required: true,
    min: 1
  },
  originalPrice: Number,
  condition: {
    type: String,
    required: true,
    enum: ['new', 'like-new', 'good', 'fair']
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['upsc', 'gate', 'neet', 'jee', 'engineering', 'medical', 'law', 'mba', 'school', 'notes', 'mathematics', 'science', 'literature', 'history', 'commerce']
  },
  subject: String,
  course: String,
  examType: String,
  
  // Listing type
  listingType: {
    type: String,
    enum: ['physical', 'digital'],
    default: 'physical'
  },
  
  // For digital notes
  digitalFile: {
    url: String,
    format: String,
    size: Number
  },
  
  // Sale type
  saleType: {
    type: String,
    enum: ['fixed', 'negotiable', 'auction'],
    default: 'fixed'
  },
  
  // Auction specific
  auctionEndDate: Date,
  currentBid: Number,
  bidders: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  
  images: [{
    url: String,
    caption: String
  }],
  
  // Stock management for libraries
  stock: {
    type: Number,
    default: 1
  },
  
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  status: {
    type: String,
    enum: ['active', 'sold', 'inactive', 'pending'],
    default: 'active'
  },
  
  views: {
    type: Number,
    default: 0
  },
  
  // Location for local exchange
  location: {
    city: String,
    state: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Delivery options
  deliveryOptions: [{
    type: String,
    enum: ['pickup', 'delivery', 'cod']
  }],
  
  // Rating for this specific listing
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

listingSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
};

module.exports = mongoose.model('Listing', listingSchema);