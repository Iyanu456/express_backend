const express = require('express');
const auth = require('../middlewares/authMiddleware');
const User = require('../models/user'); // Adjust the path to your User model

const router = express.Router();

// Route to get the user role
router.get('/api/role', auth, async (req, res) => {
    
    const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is missing' });
  }

  // The authenticated user is available in req.user
  const user = req.user;
  //const { userId } = req.body;

  try {
    // The authenticated user is available in req.user
    

    //const user = await User.findOne({ _id: userId});


    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return the user role
    res.json({ role: user.role });
  } catch (error) {
    console.error('Error fetching user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
