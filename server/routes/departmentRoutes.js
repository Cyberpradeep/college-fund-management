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
  addOrUpdateCoordinator,
  downloadMyDepartmentReportExcel,
  getCoordinator,
  deleteCoordinator,
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
router.get('/hod/report/excel', protect, hodOnly, downloadMyDepartmentReportExcel);

// HOD: Add or update Coordinator for their department
router.post('/hod/coordinator', protect, hodOnly, addOrUpdateCoordinator);
// HOD: Get current Coordinator for their department
router.get('/hod/coordinator', protect, hodOnly, getCoordinator);
// HOD: Delete Coordinator for their department
router.delete('/hod/coordinator', protect, hodOnly, deleteCoordinator);

module.exports = router;
