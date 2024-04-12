const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const protectedRoutes = require('./routes/protectedRoutes')
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

// db.js
mongoose.connect((`${process.env.DATABASE_URI}`))
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

module.exports = mongoose.connection;

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

