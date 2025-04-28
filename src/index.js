const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "*", // or your frontend URL
    methods: ["GET", "POST"],
  },
});

let counter = 0;

io.on("connection", (socket) => {
  console.log("USER CONNECTED: ", socket.id);

  socket.emit("counterUpdate", counter);

  socket.on("increment", () => {
    counter++;
    io.emit("counterUpdate", counter);
  });

  socket.on("decrement", () => {
    counter--;
    io.emit("counterUpdate", counter);
  });
});

app.use("/", async (req, res) => {
  res.send("Hobbit tentak");
});

server.listen(8000, () => {
  console.log("Socket server listening on port 8000");
});
