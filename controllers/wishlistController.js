const Wishlist = require('../models/Wishlist');
const Listing = require('../models/Listing');

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate({
        path: 'listings.listing',
        populate: {
          path: 'seller',
          select: 'name email'
        }
      });

    if (!wishlist) {
      return res.json({ success: true, data: { listings: [] } });
    }

    res.json({ success: true, data: wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add item to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { listingId } = req.body;

    // Check if listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, listings: [] });
    }

    // Check if item already in wishlist
    const existingItem = wishlist.listings.find(
      item => item.listing.toString() === listingId
    );

    if (existingItem) {
      return res.status(400).json({ success: false, message: 'Item already in wishlist' });
    }

    wishlist.listings.push({ listing: listingId });
    await wishlist.save();

    res.json({ success: true, message: 'Item added to wishlist' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove item from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { listingId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    wishlist.listings = wishlist.listings.filter(
      item => item.listing.toString() !== listingId
    );

    await wishlist.save();
    res.json({ success: true, message: 'Item removed from wishlist' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check if item is in wishlist
exports.checkWishlistItem = async (req, res) => {
  try {
    const { listingId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.json({ success: true, inWishlist: false });
    }

    const inWishlist = wishlist.listings.some(
      item => item.listing.toString() === listingId
    );

    res.json({ success: true, inWishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};