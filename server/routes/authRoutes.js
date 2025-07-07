const express = require('express');
const router = express.Router();
const { login, resetHodPassword } = require('../controllers/authController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.post('/login', login);
router.post('/reset-password', protect, adminOnly, resetHodPassword);

module.exports = router;
