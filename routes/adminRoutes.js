const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');

// Simple admin key check
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

// Get all listings with any status
router.get('/listings', adminAuth, async (req, res) => {
  try {
    const listings = await Listing.find().populate('seller', 'name email').sort('-createdAt');
    res.json({ success: true, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve listing
router.put('/listings/:id/approve', adminAuth, async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );
    res.json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reject listing
router.put('/listings/:id/reject', adminAuth, async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    res.json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
