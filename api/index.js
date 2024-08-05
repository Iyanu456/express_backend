const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
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
const authRoutes = require('./routes/auth');

//routes
const userRoutes = require('./routes/userRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const notificationRoutes = require('./routes/notifications');
const roleRoute = require('./routes/role');
const adminRoutes = require('./routes/adminRoutes'); // Add this line

require('dotenv').config();

//const liveReloadServer = livereload.createServer();
//liveReloadServer.server.once('connection', () => {
//  setTimeout(() => {
//    liveReloadServer.refresh('/');
//  }, 5000);
//});

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: ['http://185.164.111.38', 'http://localhost:5173', 'https://resume-maker-cyan.vercel.app', 'https://album-maker.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(connectLiveReload());
const port = process.env.PORT || 3001;



app.options('*', cors());  // Preflight request handling
const root = require('path').join(__dirname, 'public');
app.use(express.static(root));
app.use('/images', express.static(path.join(__dirname, '../public/images')));

//app.use('/*', (req, res) => {
	//res.sendFile(path.join(__dirname, 'public', 'index.html')
	//)})

// Increase the payload limit
app.use(bodyParser.json({ limit: '250mb' }));
app.use(bodyParser.urlencoded({ limit: '250mb', extended: true }));

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

  const { albumName, yearsAlive, fullNameOfPerson } = req.body;

  if (!albumName) {
    console.log('Missing albumName');
    return res.status(400).json({ error: 'albumName is required' });
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

    // Generate a unique album name if one already exists with the same name
    let uniqueAlbumName = albumName;
    let albumCount = 1;

    while (await Album.findOne({ userId: user._id, name: uniqueAlbumName })) {
      uniqueAlbumName = `${albumName} (${++albumCount})`;
    }

    // Create a new album
    console.log('Creating new album for user:', user._id);
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

    // Store URLs of the uploaded images in the uploadedImages array
    req.files.forEach((file) => {
      const imageUrl = `https://legacyvideobooks.io/images/${file.filename}`;
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

app.post('/local/update/:albumId', localUpload.array('files', 70), async (req, res) => {
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
      const imageUrl = `https://legacyvideobooks.io/images/${file.filename}`;
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

app.put('/update/captions', async (req, res) => {
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

//app.get('/'); 

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

app.get('/album/:albumid', async (req, res) => {
    const albumId = req.params.albumid;
  
    try {
      const album = await Album.findOne({ _id: albumId });
      const user = await User.findOne({ _id: album.userId});
  
      if (!album) {
        return res.status(404).json({ message: 'Album not found' });
      }
  
      const uploadedImages = album.uploadedImages;
  
      res.status(200).json({
        email: user.email,
        role: user.role,
        albumId: album._id,
        yearsAlive: album.yearsAlive,
        fullNameOfPerson: album.fullNameOfPerson,
        message: 'Images retrieved successfully',
        imageUrls: uploadedImages,
        status: 'success',
        ok: true,
      });
    } catch (error) {
      console.error('Error retrieving album:', error);
      res.status(500).json({ error: `${error}` });
    }
  });




  app.get('/albums/:userId', async (req, res) => {
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
        email: user.email,
        role: user.role,
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

app.use('/api', userRoutes);
app.use('/api', protectedRoutes);
app.use('/notifications', notificationRoutes);
app.use('/api', authRoutes);
app.use('/api', adminRoutes); // Add this line
app.use(roleRoute);

app.get('/api', (req, res) => {
  res.send('Hello World!');
});

app.use('/*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html')
        )})

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

server.setTimeout(800000);
