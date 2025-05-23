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
});

module.exports = mongoose.model("userWS1012", userModel);
