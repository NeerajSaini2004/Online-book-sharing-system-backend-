const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistItem
} = require('../controllers/wishlistController');

// All routes require authentication
router.use(protect);

// @route   GET /api/wishlist
// @desc    Get user's wishlist
router.get('/', getWishlist);

// @route   POST /api/wishlist
// @desc    Add item to wishlist
router.post('/', addToWishlist);

// @route   DELETE /api/wishlist/:listingId
// @desc    Remove item from wishlist
router.delete('/:listingId', removeFromWishlist);

// @route   GET /api/wishlist/check/:listingId
// @desc    Check if item is in wishlist
router.get('/check/:listingId', checkWishlistItem);

module.exports = router;