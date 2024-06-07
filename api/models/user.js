// models/User.js
const mongoose = require('mongoose');
const Album = require('./album');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    default: uuidv4, // Use uuidv4 to generate default value
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
    enum: ['guest', 'admin'], // Specify allowed values
    default: 'guest' // Default value is 'guest'
  },
  albums: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album' // Reference to the Album model
  }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
