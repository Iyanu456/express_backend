const express = require('express');
const router = express.Router();
const sendMail = require('../../config/mail');
const User = require('../../models/user');
const Purchase = require('../../models/purchase');
const crypto = require('crypto');
const bcrypt = require("bcryptjs");
require('dotenv').config();  


// Function to generate a random password for new users
const generateRandomPassword = () => {
  return crypto.randomBytes(4).toString('hex');  // Generates a random 16-character string
};

// Middleware to check for the secret key
const validateSecretKey = (req, res, next) => {
  const secretKey = req.headers['x-secret-key'];
  if (secretKey === process.env.WEBHOOK_SECRET) {
    next(); // The key is valid, proceed to the route handler
  } else {
    res.status(403).json({
      message: "Forbidden: Invalid secret key",
      status: "failed",
      ok: false,
    });
  }
};

// Apply the middleware to your routes
router.use(validateSecretKey);

router.post('/', async (req, res) => {
  const requestData = req.body || {};
  const { email, order, full_name, first_name, last_name, date_created } = requestData;

  try {
    // Check if the user exists
    let user = await User.findOne({ email });
    let randomPassword = generateRandomPassword(); 
    const hashedPassword = bcrypt.hashSync(randomPassword, 10); // Generate the random password for both cases

    if (!user) {
      // If user doesn't exist, create a new account with a random password
      user = new User({
        email,
        password: hashedPassword,  // Save the random password
        albums: [],
        purchased: true,
        numberOfPurchasedAlbums: order.quantity,
        paymentInfo: [{
          amountPaid: order.amount,
          datePaid: new Date(date_created),  // Use the payment date from the request body
          orderId: order.orderId,  // Get the order ID from the order object
        }],
      });

      await user.save();

      // Send email with the randomly generated password to the new user
      await sendMail(
        email,
        `Your New Account & Purchase Confirmation`,
        `<p>Hi ${first_name},</p>
        <p>Thank you for your purchase! A new account has been created for you. Here are your login details:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${randomPassword}</p>
        <p>Please log in with this password and update it as soon as possible.</p>`
      );
    } else {
      // If the user exists, update their payment information
      user.purchased = true;
      user.numberOfPurchasedAlbums += order.quantity;
      user.paymentInfo.push({
        amountPaid: order.amount,
        datePaid: new Date(date_created),
        orderId: order.orderId,
      });
      await user.save();
    }

    // Send a debug email with the random password to your own email (for monitoring)
    await sendMail(
      "oyerindei13@gmail.com",  // Your email address for debugging purposes
      `Debugging: New User Password`,
      `<p>Debugging information: A random password has been generated for ${email}:</p>
      <p><strong>Generated Password:</strong> ${randomPassword}</p>`
    );

    // Send purchase email to the user (new or existing)
    await sendMail(
      email,
      `Payment notification`,
      `<p>Hi ${first_name},</p>
      <p>Thank you for your purchase! Here are the details of your invoice:</p>
      <h2><b>Invoice Details</b></h2>
      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <tr>
          <th style="text-align: left;">Field</th>
          <th style="text-align: left;">Value</th>
        </tr>
        <tr>
          <td><b>Name</b></td>
          <td>${full_name}</td>
        </tr>
        <tr>
          <td><b>Email</b></td>
          <td>${email}</td>
        </tr>
        <tr>
          <td><b>Amount Paid</b></td>
          <td>$${order.amount}</td>
        </tr>
        <tr>
          <td><b>Phone</b></td>
          <td>${requestData.phone}</td>
        </tr>
      </table>`
    );

    await sendMail(
      "oyerindei13@gmail.com",
      `Payment notification`,
      `<p>Hi ${first_name},</p>
      <p>Thank you for your purchase! Here are the details of your invoice:</p>
      <h2><b>Invoice Details</b></h2>
      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <tr>
          <th style="text-align: left;">Field</th>
          <th style="text-align: left;">Value</th>
        </tr>
        <tr>
          <td><b>Name</b></td>
          <td>${full_name}</td>
        </tr>
        <tr>
          <td><b>Email</b></td>
          <td>${email}</td>
        </tr>
        <tr>
          <td><b>Amount Paid</b></td>
          <td>$${order.amount}</td>
        </tr>
        <tr>
          <td><b>Phone</b></td>
          <td>${requestData.phone}</td>
        </tr>
      </table>`
    );

    res.status(200).json({
      message: "Webhook received",
      status: "success",
      ok: true,
      data: requestData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "An error occurred",
      status: "failed",
      ok: false,
    });
  }
});

module.exports = router;
