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
      "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/f3cc8e70393349.5ba21bd701298.jpg",
  },
  grade: {
    type: String,
    enum: ["junior", "middle", "senior", "Team Lead"],
    default: "junior",
  },
});

module.exports = mongoose.model("userWS", userModel);
