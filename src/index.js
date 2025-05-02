const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/database");

const app = express();
const server = http.createServer(app);
connectDB()
app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "*", // or your frontend URL
    methods: ["GET", "POST"],
  },
});

let list = [];

io.on("connection", (socket) => {
  console.log("USER CONNECTED: ", socket.id);

  socket.emit("counterUpdate", list);

  socket.on("listadd", (data) => {
    list.push(data);
    io.emit("counterUpdate", list);
  });

  socket.on("decrement", () => {
    list--;
    io.emit("counterUpdate", list);
  });
});

app.use("/", async (req, res) => {
  res.send("Hobbit tentak");
});

server.listen(8000, () => {
  console.log("Socket server listening on port 8000");
});
