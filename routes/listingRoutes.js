const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  createListing,
  getListings,
  getListing,
  getMyListings,
  updateListing,
  deleteListing
} = require('../controllers/listingController');

router.post('/', protect, upload.fields([{ name: 'bookImage', maxCount: 1 }, { name: 'extraImages', maxCount: 4 }]), createListing);
router.get('/', getListings);
router.get('/my', protect, getMyListings);
router.get('/:id', getListing);
router.put('/:id', protect, upload.fields([{ name: 'bookImage', maxCount: 1 }, { name: 'extraImages', maxCount: 4 }]), updateListing);
router.delete('/:id', protect, deleteListing);

module.exports = router;