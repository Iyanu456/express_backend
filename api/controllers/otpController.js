const crypto = require('crypto');
const sendMail = require('../config/mail');
//const OTP = require('../models/OTP');

exports.generateOTP = async (req, res) => {
  const { email } = req.body;
  const otp = crypto.randomInt(100000, 999999); // Generate a 6-digit OTP

  try {
    // Store OTP in memory or database
    //const otpEntry = new OTP({ email, otp });
    //await otpEntry.save();

    // Send OTP via email
    await sendMail(email, `Your secure OTP IS ${otp}`, `Use the following OTP - <b>${otp}</b> to complete your Password Reset`);

    res.status(200).json({ msg: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ msg: 'Error generating OTP' });
  }
};
