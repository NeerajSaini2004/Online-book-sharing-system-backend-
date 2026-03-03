const mongoose = require('mongoose');

const notesSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  class: { type: String, required: true },
  board: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  pages: { type: Number, required: true },
  fileUrl: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  downloads: { type: Number, default: 0 },
  rating: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Notes', notesSchema);
