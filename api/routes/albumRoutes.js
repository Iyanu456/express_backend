const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs"); // Import bcrypt
const jwt = require("jsonwebtoken");
const auth = require('../middlewares/authMiddleware');

const User = require("../models/user");
const Albums = require("../models/album");

require("dotenv").config();

router.get('/album/:albumid', async (req, res) => {
    const albumId = req.params.albumid;
  
    try {
      const album = await Album.findOne({ _id: albumId });
  
      if (!album) {
        return res.status(404).json({ message: 'Album not found' });
      }
  
      const uploadedImages = album.uploadedImages;
  
      res.status(200).json({
        albumId: album._id,
        message: 'Images retrieved successfully',
        imageUrls: uploadedImages,
        status: 'success',
        ok: true,
      });
    } catch (error) {
      console.error('Error retrieving album:', error);
      res.status(500).json({ error: `error` });
    }
  });




  router.get('/albums/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      // Find the user by userId and populate the albums
      const user = await User.findById(userId).populate('albums', 'name');
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Map the albums to only include name and _id (albumId)
      const albumList = user.albums.map(album => ({
        albumId: album._id,
        albumName: album.name
      }));
  
      // Return the list of albums
      res.status(200).json({
        userId: userId,
        albums: albumList,
        status: 'success',
        ok: true
      });
    } catch (error) {
      console.error('Error occurred:', error);
      res.status(500).json({ error: `${error}` });
    }
  });
  

  
  
  
  
  module.exports = router;

