const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const protectedRoutes = require('./routes/protectedRoutes')


const multer = require('multer')
const { GridFsStorage } = require("multer-gridfs-storage")
var crypto = require('crypto');
var path = require('path');


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

app.use(cors({
	origin: ['http://localhost:5173', 'https://resume-maker-cyan.vercel.app'],
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
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = file.originalname;
      const fileInfo = {
        filename: filename,
        bucketName: "newBucket"
      };
      resolve(fileInfo);
    });
  }
});

const upload = multer({
  storage
});


app.post("/upload", upload.single("file"), (req, res) => {
  res.status(200)
    .send("File uploaded successfully");
});


// Routes


app.use(userRoutes);
app.use(protectedRoutes);

// Default route
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
