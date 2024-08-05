// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware'); // Use your existing auth middleware
const authorizeAdmin = require('../middlewares/authorizeAdmin');
const { getAllAdmins, getAllGuests, updateUserRole } = require('../controllers/adminController');

router.get('/admins', authMiddleware, authorizeAdmin, getAllAdmins);
router.get('/guests', authMiddleware, authorizeAdmin, getAllGuests);
router.put('/update-role', authMiddleware, authorizeAdmin, updateUserRole);

module.exports = router;
