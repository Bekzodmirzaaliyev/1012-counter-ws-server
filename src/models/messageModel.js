const mongoose = require("mongoose");

const messageModel = mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userWS1012",
    required: true,
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userWS1012",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timeStamp: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("messageWS1012", messageModel);

