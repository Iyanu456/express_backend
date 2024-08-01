const nodemailer = require('nodemailer');


const gmail_transporter = nodemailer.createTransport({
  service: 'gmail', // You can use any email service provider
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


const sendMail = async (to, subject, text) => {
  /*const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  };*/


  const mailOptions = { 
    from: "legacyvideobooks@legacyvideobooks.io", 
    to: to, 
    subject: subject, 
    text: text, 
    html: text,
  };


   // Add event listeners for tracking progress
   hostinger_transporter.on('token', token => {
    console.log('A new access token was generated: ', token);
  });

  hostinger_transporter.on('idle', () => {
    console.log('Transporter is now idle');
  });

  hostinger_transporter.on('error', err => {
    console.error('Error occurred:', err);
  });

  hostinger_transporter.on('send', info => {
    console.log('Message sent successfully:', info.response);
  });

  try {
    await hostinger_transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendMail;
