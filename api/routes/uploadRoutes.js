// routes/uploadRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const convert = require('heic-convert');
const sharp = require('sharp');

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


//const upload = multer({ storage: localStorage });

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const baseUrl = process.env.IMAGE_BASE_URL;

// HEIC to JPEG conversion function
async function heicToJpeg(buffer) {
  const outputBuffer = await convert({
    buffer: buffer,
    format: 'JPEG',
    quality: 1, // Adjust as needed
  });
  return outputBuffer;
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
      thumbnail: '', // Initialize thumbnail field
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

    // Process each uploaded file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      let finalBuffer = file.buffer;
      let fileExtension = path.extname(file.originalname).toLowerCase();

      // Convert HEIC to JPEG if necessary
      if (file.mimetype === 'image/heic' || fileExtension === '.heic') {
        finalBuffer = await heicToJpeg(finalBuffer); // Pass buffer instead of path
        fileExtension = '.jpg'; // Update file extension after conversion
      }

      // Get metadata to determine the aspect ratio
      const metadata = await sharp(finalBuffer).metadata();

      // Define resizing logic based on the aspect ratio
      let resizeOptions = {};
      if (metadata.width > metadata.height) {
        // Landscape orientation
        resizeOptions = { width: 1920 }; // Resize by width
      } else {
        // Portrait orientation
        resizeOptions = { height: 1440 }; // Resize by height
      }

      // Compress the image using Sharp
      const compressedImageBuffer = await sharp(finalBuffer)
        .resize(resizeOptions) // Use the defined resize options
        .toBuffer(); // Get the compressed image as a buffer

      // Generate a unique identifier for the file name
      const uniqueIdentifier = Date.now() + Math.floor(Math.random() * 1000);
      const outputFileName = `${path.parse(file.originalname).name}-${uniqueIdentifier}${fileExtension}`;
      const outputFilePath = path.join(__dirname, '..', '..', 'public', 'images', outputFileName);

      // Save the compressed image to disk
      fs.writeFileSync(outputFilePath, compressedImageBuffer);

      // Create the URL for the compressed image
      const imageUrl = `${baseUrl}/images/${outputFileName}`;
      
      // Add the compressed image URL to the album's uploadedImages array
      newAlbum.uploadedImages.push(imageUrl);

      // Create a thumbnail only for the first image
      if (i === 0) {
        const thumbnailBuffer = await sharp(finalBuffer)
          .resize({ width: 320, height: 240, fit: 'inside' }) // Maintain aspect ratio
          .jpeg({ quality: 50 }) // Adjust quality for better compression
          .toBuffer();

        const thumbnailFileName = `thumbnail-${outputFileName}`;
        const thumbnailFilePath = path.join(__dirname, '..', '..', 'public', 'thumbnails', thumbnailFileName);

        // Save the thumbnail to disk
        fs.writeFileSync(thumbnailFilePath, thumbnailBuffer);

        // Create the URL for the thumbnail image
        newAlbum.thumbnail = `${baseUrl}/thumbnails/${thumbnailFileName}`;
      }
    }

    await newAlbum.save();

    // Associate the album with the user
    user.albums.push(newAlbum._id);
    await user.save();

    res.status(201).json({
      userId: userId,
      albumName: uniqueAlbumName,
      albumId: newAlbum._id,
      message: 'Files uploaded and compressed successfully',
      status: 'success',
      ok: true,
      thumbnailUrl: newAlbum.thumbnail, // Return the thumbnail URL in the response
    });
  } catch (error) {
    console.error('Error occurred during upload and compression:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});





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

  console.log('Received /update request');
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

    // Initialize an array to store unique image URLs
const imageUrlsSet = new Set();

// Process each uploaded file
for (let file of req.files) {
  let finalBuffer = file.buffer;
  let fileExtension = path.extname(file.originalname).toLowerCase();

  // Convert HEIC to JPEG if necessary
  if (file.mimetype === 'image/heic' || fileExtension === '.heic') {
    finalBuffer = await heicToJpeg(finalBuffer); // Pass buffer directly
    fileExtension = '.jpg'; // Update file extension after conversion
  }

  // Get metadata to determine the aspect ratio
  const metadata = await sharp(finalBuffer).metadata();

  // Define resizing logic based on the aspect ratio
  let resizeOptions = {};
  if (metadata.width > metadata.height) {
    // Landscape orientation
    resizeOptions = { width: 1920 }; // Resize by width
  } else {
    // Portrait orientation
    resizeOptions = { height: 1440 }; // Resize by height
  }

  // Compress the image using Sharp
  const compressedImageBuffer = await sharp(finalBuffer)
    .resize(resizeOptions) // Use the defined resize options
    .toBuffer(); // Get the compressed image as a buffer

  // Define the path for saving the compressed image
  const outputFileName = path.parse(file.originalname).name + fileExtension;
  const outputFilePath = path.join(__dirname, '..', '..', 'public', 'images', outputFileName);

  // Save the compressed image to disk
  fs.writeFileSync(outputFilePath, compressedImageBuffer);

  // Create the URL for the compressed image
  const imageUrl = `${baseUrl}/images/${outputFileName}`;
  console.log('Image URL:', imageUrl); // Log the image URL to check its value

  // Add the compressed image URL to the album's uploadedImages array
  imageUrlsSet.add(imageUrl); // Use Set to avoid duplicates
}

// Add unique image URLs to the album
album.uploadedImages.push(...Array.from(imageUrlsSet));

// Save the updated album to the database
console.log('Saving updated album to the database');
await album.save();

// Get the current image URLs in the album
const currentImageUrls = album.uploadedImages;

    res.status(200).json({
      userId: userId,
      albumName: album.name,
      albumId: album._id,
      message: 'Files uploaded successfully',
      //files: req.files,
      currentImageUrls, // Include the current image URLs in the response
      status: 'success',
      ok: true,
    });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


module.exports = router;