const multer = require('multer');
const path = require('path');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'bookImage') {
      cb(null, 'uploads/books/');
    } else if (file.fieldname === 'noteFile' || file.fieldname === 'notesFile') {
      cb(null, 'uploads/notes/');
    } else if (file.fieldname === 'documents') {
      cb(null, 'uploads/kyc/');
    } else {
      cb(null, 'uploads/');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedFields = ['bookImage', 'noteFile', 'notesFile', 'file', 'documents'];
  
  if (!allowedFields.includes(file.fieldname)) {
    return cb(new Error(`Unexpected field: ${file.fieldname}`), false);
  }
  
  if (file.fieldname === 'bookImage') {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for book images'), false);
    }
  } else if (file.fieldname === 'noteFile' || file.fieldname === 'notesFile' || file.fieldname === 'file' || file.fieldname === 'documents') {
    // Allow PDF and document files
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Word documents, and images are allowed'), false);
    }
  } else {
    cb(null, true);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;