const express = require("express")
const cors = require("cors")
const http = require("http")
const { Server } = require("socket.io")
const connectDB = require("./config/database")
const authRoutes = require("./routes/authRoutes")
const User = require("./models/userModel")

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// Middleware
app.use(cors())
app.use(express.json())
connectDB()

// Routes
app.use("/api/v1/auth", authRoutes)

let onlineUsers = []

io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`)

  socket.on("connected", (userData) => {
    const exists = onlineUsers.find(u => u._id === userData._id)
    if (!exists) {
      const newUser = { ...userData, socketId: socket.id, status: "Online" }
      onlineUsers.push(newUser)
      console.log("✅ User connected:", newUser.username)
    }

    io.emit("users", onlineUsers)
  })

  socket.on("disconnect", () => {
    const disconnectedUser = onlineUsers.find(u => u.socketId === socket.id)
    if (disconnectedUser) {
      console.log("❌ User disconnected:", disconnectedUser.username)
    }

    onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id)
    io.emit("users", onlineUsers)
  })
})

app.get("/", (req, res) => {
  res.send("💬 Real-Time Chat Backend is Running...")
})

server.listen(8000, () => {
  console.log("🚀 Server listening on http://localhost:8000")
})
