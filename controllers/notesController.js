const Notes = require('../models/Notes');
const { uploadToCloudinary } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

exports.uploadNotes = async (req, res) => {
  try {
    const isFree = req.body.isFree === 'true' || req.body.isFree === true;
    if (!req.file) return res.status(400).json({ success: false, message: 'PDF file is required' });

    const fileUrl = process.env.CLOUDINARY_CLOUD_NAME
      ? await uploadToCloudinary(req.file.buffer, 'bookshare/notes', 'raw')
      : `/uploads/notes/${Date.now()}-${req.file.originalname}`;
    const notes = await Notes.create({
      ...req.body,
      isFree,
      price: isFree ? 0 : Number(req.body.price),
      fileUrl,
      author: req.user._id
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

    await Notes.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });

    // Cloudinary URL — add fl_attachment for proper filename download
    if (note.fileUrl.startsWith('http')) {
      const filename = encodeURIComponent(`${note.title}.pdf`);
      // Insert fl_attachment:filename into Cloudinary URL
      const downloadUrl = note.fileUrl.replace('/upload/', `/upload/fl_attachment:${filename}/`);
      return res.json({ success: true, downloadUrl });
    }

    // Local file fallback
    const filePath = path.join(__dirname, '..', note.fileUrl);
    if (fs.existsSync(filePath)) {
      return res.download(filePath, `${note.title}.pdf`);
    }

    res.status(404).json({ success: false, message: 'File not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
