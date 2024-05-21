const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middlewares/authMiddleware');
const User = require('./models/user');
const Album = require('./models/album');
const livereload = require('livereload');
const connectLiveReload = require('connect-livereload');
const fs = require('fs'); // Import fs module
require('dotenv').config();

const liveReloadServer = livereload.createServer();
liveReloadServer.server.once('connection', () => {
  setTimeout(() => {
    liveReloadServer.refresh('/');
  }, 5000);
});

const app = express();
app.use(express.static('public'));
app.use(connectLiveReload());
const port = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: ['http://localhost:5173', 'https://resume-maker-cyan.vercel.app', 'https://album-maker.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// db.js
mongoose.connect(process.env.DATABASE_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

let bucket;
mongoose.connection.on('connected', () => {
  const db = mongoose.connections[0].db;
  bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: 'uploads'
  });
  console.log(bucket);
});

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

const storage = new GridFsStorage({
  url: process.env.DATABASE_URI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = file.originalname;
      const fileInfo = {
        filename: filename,
        bucketName: 'uploads'
      };
      resolve(fileInfo);
    });
  }
});

const upload = multer({ storage });

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    const filePath = path.join('public/images', file.originalname);
    if (fs.existsSync(filePath)) {
      cb(null, file.originalname); // Allow the file with the same name, we will handle this in the POST route
    } else {
      cb(null, file.originalname);
    }
  }
});

const localUpload = multer({ storage: localStorage });

app.post('/local/upload', localUpload.array('files', 70), async (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is missing' });
  }

  // Extract the token from the Authorization header
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token is missing' });
  }

  console.log('Received /local/upload request');
  console.log('Request body:', req.body);
  console.log('Uploaded files:', req.files);

  const { userId, albumName } = req.body;

  if (!userId || !albumName) {
    console.log('Missing userId or albumName');
    return res.status(400).json({ error: 'albumName is required' });
  }

  try {
    // Find the user by userId
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract user information from the decoded token
    const userId = decoded.sub;

    console.log('Searching for user with userId:', userId);
    const user = await User.findOne({ _id: userId });
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a new album
    console.log('Creating new album for user:', user._id);
    const newAlbum = new Album({
      userId: user._id,
      name: albumName,
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

    // Store URLs of the uploaded images in the uploadedImages array
    req.files.forEach((file) => {
      const imageUrl = `https://express-backend-9bou.onrender.com/images/${file.filename}`;
      newAlbum.uploadedImages.push(imageUrl);
    });

    // Save the new album to the database
    console.log('Saving new album to the database');
    await newAlbum.save();

    // Add the album to the user's albums array
    console.log('Adding new album to user\'s albums');
    user.albums.push(newAlbum._id);
    await user.save();

    res.status(201).json({
      userId: userId,
      albumName: albumName,
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

app.get('/album/:albumid', async (req, res) => {
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
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/upload/image', upload.single('file'), (req, res) => {
  res.status(201).json({
    message: 'File uploaded successfully',
    status: 'success',
    ok: true,
  });
});

app.post('/upload/images', authMiddleware, upload.array('files', 80), (req, res) => {
  const { data } = req.body;
  const parsedData = JSON.parse(data);
  const userId = parsedData.userId;
  const albumName = parsedData.albumName;

  res.status(201).json({
    userId: userId,
    albumName: albumName,
    message: 'File uploaded successfully',
    files: req.files,
    status: 'success',
    ok: true,
  });
});

app.get('/fileinfo/:filename', (req, res) => {
  bucket.find({ filename: req.params.filename }).toArray((err, files) => {
    if (!files[0] || files.length === 0) {
      return res.status(404).json({ err: 'No files exist' });
    }

    if (err) {
      return res.status(500).json({ err: err.message });
    }

    if (['image/jpeg', 'image/png', 'image/svg+xml'].includes(files[0].contentType)) {
      bucket.openDownloadStreamByName(req.params.filename).pipe(res);
    } else {
      res.status(404).json({ err: 'Not an image' });
    }
  });
});

app.use(userRoutes);
app.use(protectedRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

server.setTimeout(600000);
