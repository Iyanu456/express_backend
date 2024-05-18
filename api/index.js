const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const Grid = require('gridfs-stream');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./middlewares/authMiddleware'); // JWT middleware
const User = require('./models/user');
const Album = require('./models/album');
require('dotenv').config();



const app = express();
const port = process.env.PORT || 3011;

//app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


const userRoutes = require('./routes/userRoutes');
const protectedRoutes = require('./routes/protectedRoutes');

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://resume-maker-cyan.vercel.app', "https://album-maker.vercel.app"],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Existing routes

app.use('/users', userRoutes);
app.use('/protected', protectedRoutes);

mongoose.connect(process.env.DATABASE_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Initialize GridFS
const conn = mongoose.connection;
let gfs;
conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('photos'); // Set collection name to 'photos'
});

// Create storage engine
const storage = new GridFsStorage({
  url: process.env.DATABASE_URI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      return {
        bucketName: 'photos',
        filename: `${Date.now()}_${file.originalname}`
      };
    } else {
      return `${Date.now()}_${file.originalname}`;
    }
  }
});

const upload = multer({ storage });



const extractUserId = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Get token from Authorization header
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify and decode token
    req.user_id = decoded.user_id; // Extract userId from decoded token
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

app.use('/albums', extractUserId);



// Route to create an album and upload images
app.post('/albums', upload.array('photos'), (req, res) => {
  const userId = req.user_id; // Get userId from middleware

  // Auto-generate album name
  const albumName = `Album ${Date.now()}`;

  // Construct new album object
  const newAlbum = new Album({
    userId: userId, // Use userId extracted from token
    name: albumName,
    uploadedImages: req.files.map(file => file.filename),
    pages: [],
  });

  // Save the new album to the database
  newAlbum.save()
    .then(album => {
      res.status(201).json({ message: 'Album created and images uploaded successfully', album });
    })
    .catch(err => {
      console.error('Error creating album:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});




app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
