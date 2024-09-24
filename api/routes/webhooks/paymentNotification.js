const express = require('express');
const router = express.Router();
const sendMail = require('../../config/mail');
const User = require('../../models/user');
const Purchase = require('../../models/purchase');
require('dotenv').config();  

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
  const { email, order, full_name, date_created } = requestData;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    
    if (user) {
      // Update user's purchase info
      user.purchased = true;
      user.numberOfAlbums += 1;
      user.paymentInfo.push({
        amountPaid: order.amount,
        datePaid: new Date(date_created),  // Use the payment date from the request body
        orderId: order.orderId,  // Get the order ID from the order object
      });
      await user.save();
    } else {
      return res.status(404).json({
        message: "User not found",
        status: "failed",
        ok: false,
      });
    }

    // Store purchase record
    const purchase = new Purchase({
      email: email,
      paymentAmount: order.amount,
      paymentDate: new Date(date_created),  // Use the payment date from the request body
    });
    await purchase.save();

    // Send success email
    await sendMail(
      "oyerindei13@gmail.com",
      `Payment notification`,
      `<p>Thank you for your recent purchase, ${full_name}. Here are the details of your invoice:</p>
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
      </table>`
    );

    res.status(200).json({
      message: "Webhook received",
      status: "success",
      ok: true,
      data: requestData
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
