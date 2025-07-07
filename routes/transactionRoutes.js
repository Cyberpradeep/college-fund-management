const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  uploadBill,
  getAllTransactions,
  verifyTransaction,
  downloadMergedPDF,
  getMyTransactions
} = require('../controllers/transactionController');
const { protect, adminOnly, hodOnly } = require('../middlewares/authMiddleware');

// File storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/uploads/temp/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// HOD Routes
router.post('/upload', protect, hodOnly, upload.array('bills'), uploadBill);
router.get('/my', protect, hodOnly, getMyTransactions);

// Admin Routes
router.get('/', protect, adminOnly, getAllTransactions);
router.put('/verify/:id', protect, adminOnly, verifyTransaction);

// Shared route
router.get('/download/:id', protect, downloadMergedPDF);

module.exports = router;
