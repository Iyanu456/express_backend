const express = require('express');
const router = express.Router();
const sendMail = require('../../config/mail');

router.get('/', async (req, res) => {

  const request_data = req.body;
  const webhookDataString = JSON.stringify(request_data, null, 2);

  console.log("Request received");
  console.log(`Data: ${JSON.stringify(request_data)}`);
 
  try {

    await sendMail(
      "oyerindei13@gmail.com", 
      `Payment notification`, 
      `a payment was made ${webhookDataString}`
    );

    res.status(200).json({ 
      message: "webhook recieved", 
      status: "success",
      ok: true, 
      data: request_data
    });
  } 
  
  catch (error) {
    res.status(500).json({ 
      message: "an error ocurred", 
      status: "failed",
      ok: false,
     });
  }
});

// Example POST route
router.post('/', async (req, res) => {

  const request_data = req.body;
  const webhookDataString = JSON.stringify(request_data, null, 2);

  console.log("Request received");
  console.log(`Data: ${JSON.stringify(request_data)}`);

  try {
    await sendMail(
      "oyerindei13@gmail.com", 
      `Payment notification`, 
      `a payment was made ${webhookDataString}`
    );

    res.status(200).json({ 
      message: "webhook recieved", 
      status: "success",
      ok: true, 
      data: request_data
    });
  } 
  
  catch (error) {
    
    res.status(500).json({ 
      message: "an error ocurred", 
      status: "failed",
      ok: false,
     });
  }
});

module.exports = router;
