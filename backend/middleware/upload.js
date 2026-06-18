const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Let Cloudinary handle the file validation
  // This prevents strict mimetype issues with iOS HEIC/HEIF or octet-stream uploads
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB max
});

module.exports = upload;
