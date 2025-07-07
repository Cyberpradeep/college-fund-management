const express = require('express');
const router = express.Router();
const {
  hodReport,
  adminReport,
  exportAdminReportPDF
} = require('../controllers/reportController');
const { protect, hodOnly, adminOnly } = require('../middlewares/authMiddleware');

router.get('/admin', protect, adminOnly, adminReport);
router.get('/admin/export', protect, adminOnly, exportAdminReportPDF); // ✅ FIXED route
router.get('/hod', protect, hodOnly, hodReport);

module.exports = router;
