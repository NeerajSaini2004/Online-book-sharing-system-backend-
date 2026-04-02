const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true },
  isbn: { type: String },
  edition: String,
  price: { type: Number, required: true, min: 1 },
  originalPrice: Number,
  condition: { type: String, default: 'Good' },
  description: { type: String, default: 'No description provided' },
  category: { type: String, default: 'General' },
  class: String,
  board: String,
  subject: String,
  course: String,
  examType: String,
  listingType: { type: String, default: 'physical' },
  digitalFile: { url: String, format: String, size: Number },
  saleType: { type: String, default: 'fixed' },
  auctionEndDate: Date,
  currentBid: Number,
  bidders: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  images: [{ url: String, caption: String }],
  stock: { type: Number, default: 1 },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'active' },
  views: { type: Number, default: 0 },
  location: {
    city: String,
    state: String,
    coordinates: { lat: Number, lng: Number }
  },
  deliveryOptions: [String],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);
