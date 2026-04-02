const Listing = require('../models/Listing');
const mongoose = require('mongoose');

exports.createListing = async (req, res) => {
  try {
    console.log('API HIT 🚀', req.body);

    const listingData = { ...req.body };

    if (req.file) {
      listingData.images = [{
        url: `/uploads/books/${req.file.filename}`,
        caption: 'Book image'
      }];
    }

    listingData.status = 'active';
    listingData.condition = String(listingData.condition || 'Good');
    listingData.category = String(listingData.category || 'General');
    listingData.description = listingData.description || 'No description provided';

    let sellerId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      const User = require('../models/User');
      const fallback = await User.findOne();
      if (!fallback) return res.status(400).json({ success: false, message: 'No valid user found' });
      sellerId = fallback._id;
    }

    const listing = await Listing.create({ ...listingData, seller: sellerId });
    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    console.error('createListing error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getListings = async (req, res) => {
  try {
    const { search, category, condition } = req.query;
    const filter = { status: 'active' };
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } }
    ];
    if (category && category !== 'All Categories') filter.category = { $regex: category, $options: 'i' };
    if (condition && condition !== 'All Conditions') filter.condition = { $regex: condition, $options: 'i' };

    const listings = await Listing.find(filter)
      .populate('seller', 'name email')
      .sort('-createdAt');
    res.json({ success: true, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    res.json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user._id }).sort('-createdAt');
    res.json({ success: true, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateListing = async (req, res) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, seller: req.user._id },
      req.body,
      { new: true }
    );
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    res.json({ success: true, data: listing });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findOneAndDelete({ _id: req.params.id, seller: req.user._id });
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    res.json({ success: true, message: 'Listing deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
