const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createListing,
  getListings,
  getListing,
  getMyListings,
  updateListing,
  deleteListing
} = require('../controllers/listingController');

router.post('/', protect, upload.single('bookImage'), createListing);
router.get('/', getListings);
router.get('/my', protect, getMyListings);
router.get('/:id', getListing);
router.put('/:id', protect, upload.single('bookImage'), updateListing);
router.delete('/:id', protect, deleteListing);

module.exports = router;