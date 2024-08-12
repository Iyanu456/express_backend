// routes/uploadRoutes.js

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

// Configure Multer storage
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'public/images';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const filePath = path.join('public/images', file.originalname);
    if (fs.existsSync(filePath)) {
      cb(null, file.originalname); // Keep the original name for now
    } else {
      cb(null, file.originalname);
    }
  }
});


const upload = multer({ storage: localStorage });
const baseUrl = process.env.IMAGE_BASE_URL;

// HEIC to JPEG conversion function
async function heicToJpeg(inputPath, outputPath) {
  const inputBuffer = await promisify(fs.readFile)(inputPath);
  const outputBuffer = await convert({
    buffer: inputBuffer,
    format: 'JPEG',
    quality: 1, // You can adjust the quality (0 to 1)
  });
  await promisify(fs.writeFile)(outputPath, outputBuffer);
}

// Upload Route
router.post('/upload', upload.array('files', 70), async (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is missing' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token is missing' });
  }

  const { albumName, yearsAlive, fullNameOfPerson } = req.body;

  if (!albumName) {
    return res.status(400).json({ error: 'albumName is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.sub;

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let uniqueAlbumName = albumName;
    let albumCount = 1;

    while (await Album.findOne({ userId: user._id, name: uniqueAlbumName })) {
      uniqueAlbumName = `${albumName} (${++albumCount})`;
    }

    const newAlbum = new Album({
      userId: user._id,
      name: uniqueAlbumName,
      yearsAlive: yearsAlive,
      fullNameOfPerson: fullNameOfPerson, 
      uploadedImages: [],
      pages: [{
        page: 1,
        mainPreviewImages: [],
        editedImages: [],
        positionsData: [{ x: 0, y: 0 }],
        zoomData: [1],
        template: 'template 1',
        visible: true,
      }],
    });

    for (let file of req.files) {
      let finalFilePath = file.path;

      if (file.mimetype === 'image/heic' || path.extname(file.originalname).toLowerCase() === '.heic') {
        const outputFileName = `${path.parse(file.filename).name}.jpg`;
        const outputPath = path.join(path.dirname(file.path), outputFileName);

        await heicToJpeg(file.path, outputPath);

        // Delete the original HEIC file after conversion
        fs.unlinkSync(file.path);

        finalFilePath = outputPath;
      }

      const imageUrl = `${baseUrl}/images/${path.basename(finalFilePath)}`;
      newAlbum.uploadedImages.push(imageUrl);
    }

    await newAlbum.save();

    user.albums.push(newAlbum._id);
    await user.save();

    res.status(201).json({
      userId: userId,
      albumName: uniqueAlbumName,
      albumId: newAlbum._id,
      message: 'Files uploaded successfully',
      files: req.files,
      status: 'success',
      ok: true,
    });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

//Album update route

router.post('/update/:albumId', upload.array('files', 70), async (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is missing' });
  }

  // Extract the token from the Authorization header
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token is missing' });
  }

  console.log('Received /local/update request');
  console.log('Request body:', req.body);
  console.log('Uploaded files:', req.files);

  const { albumId } = req.params;

  if (!albumId) {
    console.log('Missing albumId');
    return res.status(400).json({ error: 'albumId is required' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.sub;

    console.log('Searching for user with userId:', userId);
    const user = await User.findOne({ _id: userId });
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the album by albumId
    console.log('Searching for album with id:', albumId);
    const album = await Album.findOne({ _id: albumId, userId: user._id });

    if (!album) {
      console.log('Album not found');
      return res.status(404).json({ message: 'Album not found' });
    }

    // Store URLs of the uploaded images in the uploadedImages array
    req.files.forEach((file) => {
      const imageUrl = `${baseUrl}/images/${file.filename}`;
      album.uploadedImages.push(imageUrl);
    });

    // Save the updated album to the database
    console.log('Saving updated album to the database');
    await album.save();

    res.status(200).json({
      userId: userId,
      albumName: album.name,
      albumId: album._id,
      message: 'Files uploaded successfully',
      files: req.files,
      status: 'success',
      ok: true,
    });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
