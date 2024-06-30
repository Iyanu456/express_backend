// routes/notification.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdmin');

router.post('/send', auth, notificationController.sendNotification);
router.get('/', auth, isAdmin, notificationController.getNotifications);
router.put('/:id/open', auth, isAdmin, notificationController.markAsOpened);

module.exports = router;
