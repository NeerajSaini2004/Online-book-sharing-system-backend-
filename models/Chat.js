const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'offer'],
    default: 'text'
  },
  offer: {
    amount: Number,
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
  },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },
  messages: [messageSchema],
  lastMessage: {
    content: String,
    timestamp: Date,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Chat', chatSchema);