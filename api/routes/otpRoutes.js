const express = require('express');
const { check, validationResult } = require('express-validator');
const { generateOTP } = require('../controllers/otpController');
const router = express.Router();

router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  generateOTP
);

module.exports = router;
