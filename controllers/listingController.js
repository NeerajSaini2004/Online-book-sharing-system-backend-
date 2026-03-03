const Listing = require('../models/Listing');

exports.createListing = async (req, res) => {
  try {
    const listingData = { ...req.body };
    
    // Handle uploaded image
    if (req.file) {
      listingData.images = [{
        url: `/uploads/books/${req.file.filename}`,
        caption: 'Book image'
      }];
    }
    
    const listing = await Listing.create({
      ...listingData,
      seller: req.user._id
    });
    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getListings = async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'active' })
      .populate('seller', 'name email')
      .sort('-createdAt');
    res.json({ success: true, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name email');
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
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
