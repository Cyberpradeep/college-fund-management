const express = require('express');
const router = express.Router();
const {
  hodReport,
  adminReport,
  exportAdminReportPDF,
  exportHodReportPDF
} = require('../controllers/reportController');
const { protect, hodOnly, adminOnly, coordinatorOnly } = require('../middlewares/authMiddleware');

router.get('/admin', protect, adminOnly, adminReport);
router.get('/admin/export', protect, adminOnly, exportAdminReportPDF); // ✅ FIXED route
router.get('/hod', protect, hodOnly, hodReport);
router.get('/hod/export', protect, hodOnly, exportHodReportPDF); // HOD PDF export route
router.get('/coordinator', protect, coordinatorOnly, require('../controllers/reportController').coordinatorReport);

module.exports = router;
