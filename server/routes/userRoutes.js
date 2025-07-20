const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  updateUser,
  deleteUser,
  resetPassword // ✅ Fix: Import this
} = require('../controllers/userController'); // ✅ Fix: corrected typo in filename

const { protect, adminOnly } = require('../middlewares/authMiddleware');

// ✅ Apply protection to all routes below
router.use(protect, adminOnly);

// ✅ Routes

router.get('/', getAllUsers);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/reset/:id', resetPassword); // ✅ Add this after it's imported

module.exports = router;
