const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadNotes, getNotes } = require('../controllers/notesController');

router.post('/upload', protect, uploadNotes);
router.get('/', getNotes);

module.exports = router;
