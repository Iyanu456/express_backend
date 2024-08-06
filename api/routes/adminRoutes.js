// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware'); // Use your existing auth middleware
const authorizeAdmin = require('../middlewares/authorizeAdmin');
const { getAllAdmins, getAllGuests, updateUserRole, getAllUsers } = require('../controllers/adminController');

router.get('/admins', authMiddleware, authorizeAdmin, getAllAdmins);
router.get('/guests', authMiddleware, authorizeAdmin, getAllGuests);
router.put('/update-role', authMiddleware, authorizeAdmin, updateUserRole);
router.get('/users', authMiddleware, authorizeAdmin, getAllUsers);

module.exports = router;
