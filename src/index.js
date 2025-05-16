const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/database");
const auth = require("./routes/authRoutes")
const app = express();
app.use(express.json());
const server = http.createServer(app);
app.use(cors());
connectDB()

app.use("/api/v1/auth", auth)

const io = new Server(server, {
  cors: {
    origin: "*", // or your frontend URL
    methods: ["GET", "POST"],
  },
});

let list = [];

io.on("connection", (socket) => {
  console.log("USER CONNECTED: ", socket.id);

  socket.on("connected", (data) => {
    console.log(data)
    socket.broadcast.emit("users", data)
  })

});

app.use("/", async (req, res) => {
  res.send("Hobbit tentak");
});

server.listen(8000, () => {
  console.log("Socket server listening on port 8000");
});
