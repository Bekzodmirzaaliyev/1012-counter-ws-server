const express = require("express");
const userModel = require("../models/userModel");
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    console.log(req.body); //undefined
    const { username, password, email, profileImage, grade } = req.body;
    // Validation
    if (!username || !password || !email) {
      return res.status(400).json({ message: "Заполните все ячейки!" });
    }

    const checkEmail = await  userModel.findOne({ email });

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

router.post("/login", async (req, res) => {
  try {
    const { password, email } = req.body;

    if (!password || !email) {
      return res.status(400).json({
        message: "All fields is required",
      });
    }

    const checkuser = await userModel.findOne({ password, email }); // true / false

    if (!checkuser) {
      //
      return res.status(404).json("User not found");
    }

    res.status(200).json({
      message: "User founded",
      user: checkuser,
    });
  } catch (e) {
    console.log("error: ", e);
  }
});

router.get("/getAllUsers", async (req,res) => {
  try {
    const users = await userModel.find() // all users
    res.status(200).json(users)
  } catch(e) {
    console.log("SERVER ERROR:", e)
  }
})

router.get('/getUser/:id', async (req, res) => {
  try {
    const { id } = req.params
    const user = await userModel.findById(id)
    res.status(200).json(user)
  } catch (e) {
    console.log("SERVER ERROR:", e)
  }
})

module.exports = router;
