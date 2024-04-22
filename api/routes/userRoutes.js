const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs"); // Import bcrypt
const jwt = require("jsonwebtoken");
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
        message: "Email already exists. Please use a different email.",
        status: "failed",
      });
    }

    // If email doesn't exist, create a new user
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({
      message: "User created successfully.",
      status: "success",
    });
  } catch (error) {
    console.error("Error signing up:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", status: "failed" });
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
      expiresIn: "3h",
    });

    res.status(200).json({ token: `${token}`, status: "success" });
  } catch (error) {
    console.error("Error logging in:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", status: "failed" });
  }
});

module.exports = router;
