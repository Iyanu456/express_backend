const sendMail = require('../config/mail');

exports.sendEmail = async (req, res) => {
  const { to, subject, text } = req.body;
  try {
    await sendMail(to, subject, text);
    res.status(200).json({ msg: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ msg: 'Error sending email' });
  }
};