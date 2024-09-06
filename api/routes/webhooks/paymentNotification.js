const express = require('express');
const router = express.Router();
const sendMail = require('../../config/mail');
require('dotenv').config();  // Make sure to load environment variables

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

// Example GET route
router.get('/', async (req, res) => {
  const requestData = req.body;
  const customData = requestData.customData || requestData;

  console.log("Request received");
  console.log(`Data: ${JSON.stringify(requestData)}`);

  try {
    await sendMail(
      "oyerindei13@gmail.com",
      `Your Payment was Successful`,
      `<p>Your payment was successful. Here are the details of your invoice:</p>
      <h2><b>Invoice Details</b></h2>
      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <tr>
          <th style="text-align: left;">Field</th>
          <th style="text-align: left;">Value</th>
        </tr>
        <tr>
          <td><b>Name</b></td>
          <td>${customData.customer_first_name} ${customData.customer_last_name}</td>
        </tr>
        <tr>
          <td><b>Customer Email</b></td>
          <td>${customData.customer_email}</td>
        </tr>
        <tr>
          <td><b>Transaction ID</b></td>
          <td>${customData.transaction_id}</td>
        </tr>
        <tr>
          <td><b>Amount Paid</b></td>
          <td>${customData.amount_paid}</td>
        </tr>
        <tr>
          <td><b>Customer ID</b></td>
          <td>${customData.customer_id}</td>
        </tr>
        <tr>
          <td><b>Number</b></td>
          <td>${customData.number}</td>
        </tr>
        <tr>
          <td><b>Payment Status</b></td>
          <td>${customData.payment_status}</td>
        </tr>
      </table>`
    );

    res.status(200).json({
      message: "webhook received",
      status: "success",
      ok: true,
      data: customData
    });
  } catch (error) {
    res.status(500).json({
      message: "an error occurred",
      status: "failed",
      ok: false,
    });
  }
});

// Example POST route
router.post('/', async (req, res) => {
  const requestData = req.body;
  const customData = requestData.customData || requestData;

  console.log("Request received");
  console.log(`Data: ${JSON.stringify(requestData)}`);

  try {
    await sendMail(
      "oyerindei13@gmail.com",
      `Payment notification`,
      `A payment was made. Here are the details:\n\n${JSON.stringify(customData, null, 2)}`
    );

    res.status(200).json({
      message: "webhook received",
      status: "success",
      ok: true,
      data: customData
    });
  } catch (error) {
    res.status(500).json({
      message: "an error occurred",
      status: "failed",
      ok: false,
    });
  }
});

module.exports = router;
