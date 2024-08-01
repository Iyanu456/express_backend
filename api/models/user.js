// models/User.js
const mongoose = require('mongoose');
const Album = require('./album');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    default: uuidv4,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['guest', 'admin'],
    default: 'guest'
  },
  albums: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album'
  }],
  otp: {
    type: String,
    required: false
  },
  otpExpires: {
    type: Date,
    required: false
  }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
