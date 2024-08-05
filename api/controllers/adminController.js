// controllers/adminController.js
const User = require('../models/user');

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('email role');
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ msg: 'Error fetching admins', error });
  }
};


exports.getAllGuests = async (req, res) => {
    try {
      const admins = await User.find({ role: 'guest' }).select('email role');
      res.status(200).json(admins);
    } catch (error) {
      res.status(500).json({ msg: 'Error fetching users', error });
    }
  };


  exports.updateUserRole = async (req, res) => {
    const { email, role } = req.body;
  
    if (!['guest', 'admin'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid role specified' });
    }
  
    try {
      const user = await User.findOne({ email }).lean(); // Use lean() to get a plain JS object
  
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
  
      user.role = role;
      await User.updateOne({ email }, { role }); // Update the user role in the database
  
      // Remove the password field before sending the response
      delete user.password;
  
      res.status(200).json({ msg: `User role updated to ${role}`, user });
    } catch (error) {
      res.status(500).json({ msg: 'Error updating user role', error });
    }
  };