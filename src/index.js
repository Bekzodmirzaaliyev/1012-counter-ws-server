const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const User = require("./models/userModel");
const messageModel = require("./models/messageModel");
const messageRoutes = require("./routes/messageRouter");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
connectDB();

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/message", messageRoutes);

let onlineUsers = [];

(async () => {
  const users = await User.find({});
  onlineUsers = users.map((user) => ({
    _id: user._id.toString(),
    username: user.username,
    profileImage: user.profileImage,
    email: user.email,
    grade: user.grade,
    status: false,
  }));
})();

io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on("connected", (userData) => {
    console.log("🔥 Connected user: ", userData);
    onlineUsers = onlineUsers.map((user) =>
      user._id === userData._id
        ? { ...user, status: true, socketId: socket.id }
        : user
    );
    io.emit("users", onlineUsers);
  });

  socket.on("send_message", async (data) => {
    const receiver = onlineUsers.find((user) => user._id === data.to);

    const newMessage = await messageModel.create({
      from: data.from,
      to: data.to,
      text: data.message,
    });

    // 🔄 Saqlab bo‘ldi, endi yuborish
    if (receiver && receiver.socketId) {
      io.to(receiver.socketId).emit("receive_message", {
        from: data.from,
        to: data.to,
        message: data.message,
      });
    }
  });
});

app.get("/", (req, res) => {
  res.send("💬 Real-Time Chat Backend is Running...");
});

server.listen(8000, () => {
  console.log("🚀 Server listening on http://localhost:8000");
});
