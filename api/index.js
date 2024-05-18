const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const protectedRoutes = require('./routes/protectedRoutes')


const multer = require('multer')
const { GridFsStorage } = require("multer-gridfs-storage")
var crypto = require('crypto');
var path = require('path');


//const multer = require('multer');
//const { GridFsStorage } = require('multer-gridfs-storage');
//const crypto = require('crypto');
//const path = require('path');
//const cors = require('cors');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middlewares/authMiddleware');
const User = require('./models/user');
const Album = require('./models/album');


const cors = require('cors');

var livereload = require("livereload");
var connectLiveReload = require("connect-livereload");

require('dotenv').config();

const liveReloadServer = livereload.createServer();
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

const app = express();
app.use(connectLiveReload());
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

app.use(cors({
	origin: ['http://localhost:5173', 'https://resume-maker-cyan.vercel.app', 'https://album-maker.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// db.js
mongoose.connect((`${process.env.DATABASE_URI}`))
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));


let bucket;
mongoose.connection.on("connected", () => {
  var db = mongoose.connections[0].db;
  bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: "newBucket"
  });
  console.log(bucket);
})

//to parse json content
app.use(express.json());
//to parse body from url
app.use(express.urlencoded({
  extended: false
}))

const storage = new GridFsStorage({
  url: process.env.DATABASE_URI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = file.originalname;
      const fileInfo = {
        filename: filename,
        bucketName: "uploads"
      };
      resolve(fileInfo);
    });
  }
});

const upload = multer({
  storage
});


app.post("/upload/image", upload.single("file"), (req, res) => {
 
    res.status(201).json({
      message: "File uploaded successfully",
      status: "success",
      ok: true,
    });
});


app.post('/upload/images', authMiddleware, upload.array('files', 120), async (req, res) => {

  const { data } = req.body;
  const parsedData = JSON.parse(data); 

  const userId = parsedData.userId;
  const albumName= parsedData.albumName;


  try {
    // Find user by userId
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if album already exists or create a new one
    let album = await Album.findOne({ userId: user._id, name: albumName });
    if (!album) {
      album = new Album({
        userId: user._id,
        name: albumName,
        uploadedImages: [],
        pages: [
          {
            page: 1,
            mainPreviewImages: [],
            editedImages: [],
            positionsData: [{ x: 0, y: 0 }],
            zoomData: [1],
            template: 'template 1',
            visible: true,
          },
        ],
      });
    }

    // Add image URLs to the album's mainPreviewImages and editedImages arrays
    files.forEach((file) => {
      const imageUrl = `https://express-backend-9bou.onrender.com/api/files/${file.filename}`;
      //album.pages[0].mainPreviewImages.push(imageUrl);
      //album.pages[0].editedImages.push(imageUrl);
      album.uploadedImages.push(imageUrl);
    });

    // Save the updated album
    await album.save();

    // Add the album to the user's albums array if it's a new album
    if (!user.albums.includes(album._id)) {
      user.albums.push(album._id);
      await user.save();
    }

    res.status(201).json({
      userId: userId,
      albumName: albumName,
      albumId: album._id,
      message: "File uploaded successfully",
      files: req.files,
      status: "success",
      ok: true,
    });
  
  
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading files', error });
  }
});

  


// Routes


app.use(userRoutes);
app.use(protectedRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Error handling middleware (placed at the end)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});