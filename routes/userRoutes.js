const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
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
    const { uploadToCloudinary } = require('../middleware/upload');
    
    const documents = await Promise.all(req.files.map(async (file) => {
      let url;
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        url = await uploadToCloudinary(file.buffer, 'bookshare/kyc', 'raw');
      } else {
        url = `/uploads/kyc/${Date.now()}-${file.originalname}`;
      }
      return {
        type: req.body.documentType || 'identity',
        url: url
      };
    }));

    await User.findByIdAndUpdate(
      req.user._id,
      { 
        $push: { kycDocuments: { $each: documents } },
        kycStatus: 'pending'
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'KYC documents uploaded successfully'
    });
  } catch (error) {
    console.error('KYC upload error:', error.message);
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

// Send message to seller (no contact info exposed)
router.post('/message', protect, async (req, res) => {
  try {
    const { sellerId, bookId, bookTitle, message } = req.body;
    if (!sellerId || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'sellerId and message required' });
    }
    const seller = await User.findById(sellerId);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    // Store message in seller's inbox (in User model as array)
    await User.findByIdAndUpdate(sellerId, {
      $push: {
        inbox: {
          from: req.user._id,
          fromName: req.user.name,
          bookId,
          bookTitle,
          message: message.trim(),
          read: false,
          createdAt: new Date()
        }
      }
    });

    res.json({ success: true, message: 'Message sent to seller' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get my inbox messages
router.get('/inbox', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('inbox').populate('inbox.from', 'name');
    const inbox = (user.inbox || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: inbox });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark message as read
router.put('/inbox/:msgId/read', protect, async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user._id, 'inbox._id': req.params.msgId },
      { $set: { 'inbox.$.read': true } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete inbox message
router.delete('/inbox/:msgId', protect, async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { inbox: { _id: req.params.msgId } } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;