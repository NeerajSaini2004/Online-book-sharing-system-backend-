const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary if credentials exist
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Cloudinary storage
const cloudinaryStorage = process.env.CLOUDINARY_CLOUD_NAME ? new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: file.fieldname === 'bookImage' ? 'bookshare/books' : file.fieldname === 'notesFile' ? 'bookshare/notes' : 'bookshare/kyc',
    allowed_formats: file.fieldname === 'bookImage' ? ['jpg', 'jpeg', 'png', 'webp'] : ['pdf', 'jpg', 'jpeg', 'png'],
    resource_type: file.fieldname === 'notesFile' ? 'raw' : 'image'
  })
}) : null;

// Local disk storage fallback
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'bookImage') cb(null, 'uploads/books/');
    else if (file.fieldname === 'notesFile' || file.fieldname === 'notesFile') cb(null, 'uploads/notes/');
    else if (file.fieldname === 'documents') cb(null, 'uploads/kyc/');
    else cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'bookImage') {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only images allowed'), false);
  } else {
    const allowed = ['application/pdf', 'application/msword', 'image/jpeg', 'image/png'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage: cloudinaryStorage || diskStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

module.exports = upload;