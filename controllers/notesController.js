const Notes = require('../models/Notes');

exports.uploadNotes = async (req, res) => {
  try {
    const notes = await Notes.create({ ...req.body, author: req.user._id });
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
