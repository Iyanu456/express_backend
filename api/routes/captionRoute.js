const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const convert = require('heic-convert');

// Import your User and Album models
const User = require('../models/user');
const Album = require('../models/album');


router.put('/update/captions', async (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is missing' });
  }

  const { albumId, fullNameOfPerson, yearsAlive } = req.body;

  if (!albumId || !fullNameOfPerson) {
    return res.status(400).send('Album ID and full name are required.');
  }

  try {
    const album = await Album.findByIdAndUpdate(
      albumId,
      { fullNameOfPerson, yearsAlive },
      { new: true }
    );

    if (!album) {
      return res.status(404).send('Album not found.');
    }

    res.status(200).send(album);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while updating the album.');
  }
});

module.exports = router;