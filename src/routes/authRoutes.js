const express = require("express");
const userModel = require("../models/userModel");
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, password, email, profileImage, grade } = req.body;

    // Validation
    if (!username || !password || !email) {
      res.status(400).json({ message: "Заполните все ячейки!" });
    }

    const checkEmail = userModel.findOne({ email });

    if (checkEmail) {
      res.status(409).json({ message: "Такой email уже существует" });
    }

    const newUser = new userModel({
      username,
      password,
      email,
      profileImage,
      grade,
    });
    await newUser.save();

    res.status(201).json({
      message: "Account created successfully",
      newUser,
    });
  } catch (error) {
    console.log("Server error: ", error);
  }
});



module.exports = router;
