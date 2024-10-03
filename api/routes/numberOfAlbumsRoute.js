const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const User = require('../models/user'); // Import your User model

// Route to fetch the number of purchased albums based on the user's email
router.get('/', auth, async (req, res) => {
  //const { user_id } = req.query; // Assume email is passed as a query parameter
  

  try {
    // Find the user by their user_id
    //const user = await User.findOne({ _id: user_id });
    const user = req.user;

    // If no user is found
    if (!user) {
      return res.status(200).json({
        user: user,
        message: 'User not found',
        status: 'failed',
        ok: false,
      });
    }

    // Respond with the number of purchased albums
    res.status(200).json({
      message: `User found`,
      numberOfPurchasedAlbums: user.numberOfPurchasedAlbums, // Fetch the number of albums
      ok: true,
    });
  } catch (error) {
    // Catch any errors
    console.error('Error fetching user:', error);
    res.status(500).json({
      message: 'Server error',
      status: 'failed',
      ok: false,
    });
  }
});

module.exports = router;
