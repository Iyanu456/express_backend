const Notification = require('../models/notifications');
const User = require('../models/user');
const Album = require('../models/album');

exports.sendNotification = async (req, res) => {
  try {
    const { albumId } = req.body;

    // Retrieve the album to get the guestUserId
    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const guestUserId = album.userId;

    // Find all admin users
    const admins = await User.find({ role: 'admin' });

    // Check if a notification already exists for each admin user
    for (const admin of admins) {
      const existingNotification = await Notification.findOne({
        album: albumId,
        guestUser: guestUserId,
        adminUser: admin._id,
      });

      if (!existingNotification) {
        const notification = new Notification({
          album: albumId,
          guestUser: guestUserId,
          adminUser: admin._id,
        });

        await notification.save();
      }
    }

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
