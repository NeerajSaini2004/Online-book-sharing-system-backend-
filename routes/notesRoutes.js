const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadNotes, getNotes, downloadNotes } = require('../controllers/notesController');

router.post('/upload', protect, upload.single('notesFile'), uploadNotes);
router.get('/', getNotes);
router.get('/download/:id', downloadNotes);

module.exports = router;
