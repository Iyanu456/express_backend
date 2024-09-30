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
  },
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
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
  numberOfPurchasedAlbums: { type: Number, default: 0 },
  otp: {
    type: String,
    required: false
  },
  otpExpires: {
    type: Date,
    required: false
  },
  purchased: {
    type: Boolean,
    default: false,
  },
  paymentInfo: [
    {
      amountPaid: {
        type: Number,
        required: true
      },
      datePaid: {
        type: Date,
        default: Date.now,
        required: true
      },
      orderId: {
        type: String,
        required: true
      }
    }
  ]
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
