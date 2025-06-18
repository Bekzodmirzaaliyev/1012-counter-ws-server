const mongoose = require("mongoose");

const userModel = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  profileImage: {
    type: String,
    default:
      "https://static.vecteezy.com/system/resources/thumbnails/024/624/549/small_2x/3d-rendering-person-icon-3d-render-blue-user-sign-icon-png.png",
  },
  grade: {
    type: String,
    enum: ["junior", "middle", "senior", "Team Lead"],
    default: "junior",
  },
  description: {
    type: String,
    default: "No description",
  },
  role: {
    type: String,
    enum: ["user", "admin", "moderator", "owner", "vip"],
    default: "user",
  },
  isBan: {
    type: Boolean,
    default: false,
  },
  isMute: {
    type: Boolean,
    default: false,
  },
  warn: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("userWS1012", userModel);
