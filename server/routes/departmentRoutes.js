const express = require('express');
const router = express.Router();

const {
  createDepartment,
  getDepartments,
  updateDepartment,
  allocateFund,
  getDepartmentReport,
  downloadDepartmentReportPDF,
  updateHodEmail,
  updateHodPassword,
  deleteDepartment,
  downloadMyDepartmentReportPDF, // ✅
} = require('../controllers/departmentController');

const { protect, adminOnly, hodOnly } = require('../middlewares/authMiddleware');

// Admin routes
router.post('/', protect, adminOnly, createDepartment);
router.get('/', protect, adminOnly, getDepartments);
router.put('/:id', protect, adminOnly, updateDepartment);
router.put('/:id/hod/email', protect, adminOnly, updateHodEmail);
router.put('/:id/hod/password', protect, adminOnly, updateHodPassword);
router.post('/allocate/:id', protect, adminOnly, allocateFund);
router.get('/report/:id', protect, adminOnly, getDepartmentReport);
router.get('/report/:id/pdf', protect, adminOnly, downloadDepartmentReportPDF);
router.delete('/:id', protect, adminOnly, deleteDepartment);

// HOD-only route
router.get('/hod/report/pdf', protect, hodOnly, downloadMyDepartmentReportPDF);

module.exports = router;
