const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  uploadBill,
  getAllTransactions,
  verifyTransaction,
  downloadMergedPDF,
  getMyTransactions,
  exportTransactionsExcel,
  uploadBillCoordinator
} = require('../controllers/transactionController');
const { protect, adminOnly, hodOnly, coordinatorOnly } = require('../middlewares/authMiddleware');

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
router.post('/upload', protect, coordinatorOnly, upload.array('bills'), uploadBill);
router.get('/my', protect, getMyTransactions);

// Admin Routes
router.get('/', protect, adminOnly, getAllTransactions);
router.get('/export/excel', protect, adminOnly, exportTransactionsExcel);
// HOD Route for verifying bills
router.put('/verify/:id', protect, hodOnly, verifyTransaction);

// Coordinator Route
router.post('/coordinator/upload', protect, coordinatorOnly, upload.array('bills'), uploadBillCoordinator);

// Shared route - allow admin, hod, and coordinator to download
router.get('/download/:id', protect, downloadMergedPDF);

module.exports = router;
