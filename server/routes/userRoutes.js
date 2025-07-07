const express = require('express');
const router = express.Router();

const {
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,
  resetPassword // ✅ Fix: Import this
} = require('../controllers/userContoller'); // ✅ Fix: corrected typo in filename

const { protect, adminOnly } = require('../middlewares/authMiddleware');

// ✅ Apply protection to all routes below
router.use(protect, adminOnly);

// ✅ Routes
router.post('/', createUser);
router.get('/', getAllUsers);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/reset/:id', resetPassword); // ✅ Add this after it's imported

module.exports = router;
