// controllers/notificationController.js
const Notification = require('../models/notifications');
const User = require('../models/user');
const Album = require('../models/album');

exports.sendNotification = async (req, res) => {
  try {
    const { albumId } = req.body;
    const guestUserId = req.user.id;

    // Find all admin users
    const admins = await User.find({ role: 'admin' });

    // Create a notification for each admin user
    const notifications = admins.map(admin => ({
      album: albumId,
      guestUser: guestUserId,
      adminUser: admin._id,
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({ message: 'Album sent to admin successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    // Get notifications for the logged-in admin
    const notifications = await Notification.find({ adminUser: req.user.id })
      .populate('album')
      .populate('guestUser')
      .sort({ dateSent: -1 });

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAsOpened = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { opened: true });

    res.status(200).json({ message: 'Notification marked as opened' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
