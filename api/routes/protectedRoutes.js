const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/protected-route', authMiddleware, (req, res) => {
  // This route is protected and requires authentication
  res.json({ message: 'You are authorized to access this route.' });
});

module.exports = router;

