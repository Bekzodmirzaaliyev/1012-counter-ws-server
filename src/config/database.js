const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://Bekzod:6862442@cluster0.qn6t2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("Database connected successfully!");
  } catch (e) {
    console.error("database error: ", e);
  }
};

module.exports = connectDB;
