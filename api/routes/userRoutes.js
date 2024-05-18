const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs"); // Import bcrypt
const jwt = require("jsonwebtoken");
const auth = require('../middlewares/authMiddleware');

const bodyParser = require('body-parser');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');
const User = require("../models/user");
const Albums = require("../models/album");



require("dotenv").config();

// Define routes
router.get("/test1", (req, res) => {
  res.send("Hello World! This is the first route");
});

router.get("/test2", (req, res) => {
  res.send("Hello World! This is the second route");
});

// Add more routes as needed...

router.post("/signup", async (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      message: "request body not found",
      status: "failed",
    });
  }

  const { email, password } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ message: "Email is required.", status: "failed" });
  }

  if (!password) {
    return res
      .status(400)
      .json({ message: "Password is required.", status: "failed" });
  }

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "email already exists",
        ok: false,
        status: "failed",
      });
    }

    // If email doesn't exist, create a new user
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

     // Generate JWT token
    const token = jwt.sign({ sub: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "3h",
    });

    res.status(201).json({
      message: "User created successfully.",
      status: "success",
      ok: true,
      token: `${token}`,
    });
  } catch (error) {
    console.error("Error signing up:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", status: "failed", error: `${error}` });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by username
    const user = await User.findOne({ email });

    // Check if user exists and password is correct
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res
        .status(401)
        .json({ message: "Invalid email or password.", status: "failed" });
    }

    // Generate JWT token
    const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "login successful", ok: true, token: `${token}`, status: "success" });
  } catch (error) {
    console.error("Error logging in:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", status: "failed", error: `${error}` });
  }
});


router.post("/templates", async (req, res) => {
  const token = req.headers.authorization; // Assuming the token is included in the Authorization header
  const { templateData } = req.body;

  try {
    // Decode the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract the user_id from the decoded token payload
    const userId = decoded.sub;

    // Now you have the user_id and can use it to perform operations

    // For example, you can use the userId to find the user in the database
    const user = await User.findById(userId);

     // Check if the user exists
     if (!user) {
      return res.status(404).json({
        message: "User not found.",
        status: "failed",
      });
    }

    // Create a new template object
    const newTemplate = {
      id: uuidv4(), // Generate a unique ID for the template
      ...templateData,
    };

     // Add the new template to the user's list of templates
     user.templates.push(newTemplate);

     // Save the updated user document
     await user.save();

     res.status(201).json({
      message: "Template created successfully.",
      status: "success",
      template: newTemplate,
    });

    // Continue with your logic...
  } catch (error) {
    console.error("Error decoding JWT token:", error);
    res.status(401).json({
      message: "Unauthorized",
      status: "failed",
      ok: false,
      error: `${error}`,
    });
  }
});




module.exports = router;
