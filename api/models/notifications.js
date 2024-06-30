// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album',
    required: true,
  },
  guestUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dateSent: {
    type: Date,
    default: Date.now,
  },
  opened: {
    type: Boolean,
    default: false,
  },
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
