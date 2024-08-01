// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Generate and send OTP
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const otp = crypto.randomBytes(3).toString('hex'); // Generate a random 6-digit OTP
  const otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { otp, otpExpires },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Configure nodemailer to send OTP email
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const hostinger_transporter = nodemailer.createTransport({
        host: 'smtp.hostinger.com', // SMTP server
        port: 587, // SMTP port
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.HOSTINGER_EMAIL_USER, // Your email address
          pass: process.env.HOSTINGER_EMAIL_PASS // Your email password
        },
        tls: {
          rejectUnauthorized: false // Disable certificate validation (useful for testing)
        },
        logger: true, // Enable logging
        debug: true // Enable debugging
      });
      

    const mailOptions = {
      from: 'legacyvideobooks@legacyvideobooks.io',
      to: email,
      subject: 'Your OTP Code',
      text: `Your secure OTP is ${otp}`,
      html: `Use the following OTP - <b>${otp}</b> to complete your Password Reset`
    };

    await hostinger_transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'OTP sent' });
  } catch (error) {
    console.error('Error sending OTP', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});




// routes/auth.js (add this below the send-otp route)
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
  
    try {
      const user = await User.findOne({ email, otp });
  
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }
  
      if (Date.now() > user.otpExpires) {
        return res.status(400).json({ success: false, message: 'OTP expired' });
      }
  
      res.json({ success: true, message: 'OTP verified' });
    } catch (error) {
      console.error('Error verifying OTP', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
  
  module.exports = router;
  




module.exports = router;
