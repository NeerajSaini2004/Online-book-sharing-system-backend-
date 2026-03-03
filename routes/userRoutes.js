const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const bcrypt = require('bcryptjs');

router.get('/profile', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: { user: req.user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/kyc/upload', protect, upload.array('documents', 5), async (req, res) => {
  try {
    const documents = req.files.map(file => ({
      type: req.body.documentType || 'identity',
      url: file.path
    }));

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $push: { kycDocuments: { $each: documents } },
        kycStatus: 'pending'
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'KYC documents uploaded successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/kyc/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('kycStatus kycDocuments');
    res.json({
      success: true,
      data: { 
        kycStatus: user.kycStatus,
        documents: user.kycDocuments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;