const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require('../middlewares/authMiddleware');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const User = require("../models/user");
const Album = require("../models/album");

require("dotenv").config();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/video-uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage });
const baseUrl = process.env.IMAGE_BASE_URL;

router.post('/video-upload/:albumId', upload.single('file'), async (req, res) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) return res.status(401).json({ error: 'Authorization header is missing' });

    const token = authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token is missing' });

    try {
        // Verify the JWT token (optional if already verified by middleware)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        const { albumId } = req.params;

        if (!albumId) {
            console.log('Missing albumId');
            return res.status(400).json({ error: 'albumId is required' });
        }

        // Find the album by ID
        const album = await Album.findById(albumId);

        if (!album) {
            return res.status(404).json({ error: 'Album not found' });
        }

        // If a video already exists, delete it from the server
        if (album.uploadedVideo) {
            let videoPathRelative = album.uploadedVideo.replace(`${baseUrl}`, '');
            videoPathRelative = videoPathRelative.replace('/api', '');
            let existingVideoPath = path.join(__dirname, '..', 'public', videoPathRelative);
            console.log(existingVideoPath);
            existingVideoPath = existingVideoPath.replace('\api', '');
            
            fs.unlink(existingVideoPath, (err) => {
                if (err) {
                    console.error('Error deleting existing video:', err);
                } else {
                    console.log('Existing video deleted successfully');
                }
            });
        }

        // Construct the new video URL (full URL for the client)
        const videoUrl = `${baseUrl}/video-uploads/${req.file.filename}`;

        // Update the album's uploadedVideo field with the new video URL
        album.uploadedVideo = videoUrl;
        await album.save();

        // Respond with the updated album and the new video URL
        res.status(200).json({ album, videoUrl });
    } catch (err) {
        console.error('Error uploading video:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
