const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Tidak ada file yang diunggah' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ 
    message: 'File berhasil diunggah', 
    url: fileUrl, 
    filename: req.file.originalname,
    size: req.file.size
  });
});

module.exports = router;
