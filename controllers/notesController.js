const Notes = require('../models/Notes');
const path = require('path');
const fs = require('fs');

exports.uploadNotes = async (req, res) => {
  try {
    const isFree = req.body.isFree === 'true' || req.body.isFree === true;
    const fileUrl = req.file ? `/uploads/notes/${req.file.filename}` : null;
    if (!fileUrl) return res.status(400).json({ success: false, message: 'PDF file is required' });

    // For mock/test users, find or use a real user id
    let authorId = req.user._id;
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      const User = require('../models/User');
      const fallback = await User.findOne();
      if (!fallback) return res.status(400).json({ success: false, message: 'No valid user found' });
      authorId = fallback._id;
    }

    const notes = await Notes.create({
      ...req.body,
      isFree,
      price: isFree ? 0 : Number(req.body.price),
      fileUrl,
      author: authorId
    });
    await notes.populate('author', 'name');
    res.status(201).json({ success: true, data: notes });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const notes = await Notes.find().populate('author', 'name').sort('-createdAt');
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.downloadNotes = async (req, res) => {
  try {
    const note = await Notes.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Notes not found' });
    if (!note.isFree) return res.status(403).json({ success: false, message: 'Purchase required' });

    // Try multiple possible paths
    const possiblePaths = [
      path.join(__dirname, '..', note.fileUrl),
      path.join(__dirname, '..', 'uploads', 'notes', path.basename(note.fileUrl)),
      path.join('/tmp', path.basename(note.fileUrl))
    ];

    let filePath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      // File not on disk - return the URL for direct access
      const fileUrl = note.fileUrl.startsWith('http') 
        ? note.fileUrl 
        : `${req.protocol}://${req.get('host')}${note.fileUrl}`;
      return res.json({ 
        success: true, 
        downloadUrl: fileUrl,
        message: 'Use downloadUrl to access file'
      });
    }

    await Notes.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });
    res.download(filePath, `${note.title}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
