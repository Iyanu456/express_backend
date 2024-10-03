const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const livereload = require('livereload');
const connectLiveReload = require('connect-livereload');
const fs = require('fs');
const { promisify } = require('util');
const convert = require('heic-convert');



//routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const notificationRoutes = require('./routes/notifications');
const roleRoutes = require('./routes/role');
const adminRoutes = require('./routes/adminRoutes');
const captionRoutes = require ('./routes/captionRoute');
const albumRoutes = require('./routes/albumRoutes');
const videoRoutes = require('./routes/videoRoutes');
const paymentWebhook = require('./routes/webhooks/paymentNotification');
const numberOfAlbumsRoute = require ('./routes/numberOfAlbumsRoute');



require('dotenv').config();
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors({

  origin: [
    'http://185.164.111.38', 
    'http://localhost:5173', 
    'https://resume-maker-cyan.vercel.app', 
    'https://album-maker.vercel.app'
    ],

  methods: [
    'GET', 
    'POST', 
    'PUT', 
    'DELETE', 
    'OPTIONS'
    ],

  allowedHeaders: [
  'Content-Type', 
  'Authorization'
  ],

}));


app.use(connectLiveReload());
const port = process.env.PORT || 3001;



app.options('*', cors());  // Preflight request handling
const root = require('path').join(__dirname, 'public');


app.use(express.static(root));
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/video-uploads', express.static(path.join(__dirname, '../public/video-uploads')));
app.use(bodyParser.json({ limit: '250mb' }));
app.use(bodyParser.urlencoded({ limit: '250mb', extended: true }));

// db.js
mongoose.connect(process.env.DATABASE_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//routesss
app.use('/api', userRoutes);
app.use('/local', uploadRoutes);
app.use('/api', protectedRoutes);
app.use('/notifications', notificationRoutes);
app.use('/api', authRoutes);
app.use('/api', adminRoutes);
app.use(roleRoutes);
app.use(captionRoutes);
app.use(albumRoutes);
app.use('/api', videoRoutes);
app.use('/api/webhooks/payment_notification', paymentWebhook);
app.use('/api/purchased_albums', numberOfAlbumsRoute)


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
