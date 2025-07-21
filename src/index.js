const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRouter");
const socketHandler = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
connectDB();
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));
app.use(express.json());

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/message", messageRoutes);

// ✅ Socket logic
socketHandler(io);

app.get("/", (req, res) => {
  res.send("💬 Real-Time Chat Backend is Running...");
});

server.listen(8000, () => {
  console.log("🚀 Server listening on http://localhost:8000");
});
