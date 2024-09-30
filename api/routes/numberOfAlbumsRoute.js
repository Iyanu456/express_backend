const express = require('express');
const router = express.Router();
const User = require('../../models/user'); // Import your User model

// Route to fetch the number of purchased albums based on the user's email
router.get('/purchased-albums', async (req, res) => {
  const { email } = req.query; // Assume email is passed as a query parameter

  try {
    // Find the user by their email
    const user = await User.findOne({ email });

    // If no user is found
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        status: 'failed',
        ok: false,
      });
    }

    // Respond with the number of purchased albums
    res.status(200).json({
      message: `User found`,
      numberOfAlbums: user.numberOfAlbums, // Fetch the number of albums
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
