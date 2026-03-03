const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createBlog, getBlogs, getBlog } = require('../controllers/blogController');

router.post('/', protect, createBlog);
router.get('/', getBlogs);
router.get('/:id', getBlog);

module.exports = router;
