const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const User = require("./models/userModel");
const messageModel = require("./models/messageModel");
const messageRoutes = require("./routes/messageRouter");
const userModel = require("./models/userModel");
const { log } = require("console");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));
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
    role: user.role,
    isBan: user.isBan,
    isMute: user.isMute,
    warn: user.warn,
  }));
})();

io.on("connection", (socket) => {
  console.log(`🔌 Yangi foydalanuvchi ulandi: ${socket.id}`);

  // User ulanayotganda frontdan userni yuborish kerak
  socket.on("connected", (userData) => {
    console.log("🔥 Ulandi: ", userData);

    onlineUsers = onlineUsers.map((user) =>
      user._id === userData._id
        ? { ...user, status: true, socketId: socket.id }
        : user
    );

    io.emit("users", onlineUsers);
  });

  // ✅ BAN
  socket.on("ban", async ({ userID, selectedUser, reason }) => {
    const beruvchi = await User.findById(userID);
    const oluvchi = await User.findById(selectedUser);

    if (!beruvchi || !oluvchi) {
      return socket.emit("admin_notification", {
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }

    if (!["owner", "admin"].includes(beruvchi.role)) {
      return socket.emit("admin_notification", {
        success: false,
        message: "Sizda ruxsat yo‘q",
      });
    }

    if (oluvchi.role === "owner") {
      return socket.emit("admin_notification", {
        success: false,
        message: "Ownerni ban qilib bo‘lmaydi",
      });
    }

    if (oluvchi.isBan) {
      return socket.emit("admin_notification", {
        success: false,
        message: "Bu user allaqachon ban qilingan",
      });
    }

    oluvchi.isBan = true;
    await oluvchi.save();

    onlineUsers = onlineUsers.map((user) =>
      user._id === oluvchi._id.toString() ? { ...user, isBan: true } : user
    );

    io.emit("BanResult", onlineUsers);

    const filter = onlineUsers.find(
      (user) => user._id === oluvchi._id.toString()
    );
    if (filter?.socketId) {
      io.to(filter.socketId).emit("Ban_Result_reciever", {
        success: false,
        message: `Sizga ${beruvchi.username} tomonidan ban berildi. Sabab: ${reason}`,
        user: oluvchi,
      });
    }
  });

  // ✅ UNBAN
  socket.on("unban", async ({ userID, selectedUser }) => {
    const beruvchi = await User.findById(userID);
    const oluvchi = await User.findById(selectedUser);

    if (!beruvchi || !oluvchi) {
      return socket.emit("admin_notification", {
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }

    if (!["owner", "admin"].includes(beruvchi.role)) {
      return socket.emit("admin_notification", {
        success: false,
        message: "Sizda ruxsat yo‘q",
      });
    }

    if (!oluvchi.isBan) {
      return socket.emit("admin_notification", {
        success: false,
        message: "Bu user ban qilinmagan",
      });
    }

    oluvchi.isBan = false;
    await oluvchi.save();

    onlineUsers = onlineUsers.map((user) =>
      user._id === oluvchi._id.toString() ? { ...user, isBan: false } : user
    );

    io.emit("BanResult", onlineUsers);

    const filter = onlineUsers.find(
      (user) => user._id === oluvchi._id.toString()
    );
    if (filter?.socketId) {
      io.to(filter.socketId).emit("Ban_Result_reciever", {
        success: true,
        message: `Sizga ${beruvchi.username} tomonidan unban berildi.`,
        user: oluvchi,
      });
    }
  });

  // ✅ SEND MESSAGE
  socket.on("send_message", async (data) => {
    const receiver = onlineUsers.find((user) => user._id === data.to);

    const newMessage = await messageModel.create({
      from: data.from,
      to: data.to,
      text: data.text,
    });

    if (receiver?.socketId) {
      io.to(receiver.socketId).emit("receive_message", {
        from: data.from,
        to: data.to,
        text: data.text,
        date: {
          day: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
        },
      });
    }
  });

  // ✅ SET ROLE (admin, moderator, vip, etc.)
  socket.on("setAdmin", async (data) => {
    const beruvchi = await userModel.findById(data.userID);
    const oluvchi = await userModel.findById(data.selectedUser);

    if (!beruvchi || !oluvchi) {
      return socket.emit("admin_notification", {
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }

    if (!["user", "admin", "moderator", "vip"].includes(data.role)) {
      return socket.emit("admin_notification", {
        success: false,
        message: "Noto‘g‘ri role",
      });
    }

    if (!["owner", "admin"].includes(beruvchi.role)) {
      return socket.emit("admin_notification", {
        success: false,
        message: "Ruxsat yo‘q",
      });
    }

    if (oluvchi.role === "owner") {
      return socket.emit("admin_notification", {
        success: false,
        message: "Ownerni role o‘zgartirib bo‘lmaydi",
      });
    }

    if (oluvchi.role === data.role) {
      return socket.emit("admin_notification", {
        success: false,
        message: `U allaqachon ${data.role}`,
      });
    }

    oluvchi.role = data.role;
    await oluvchi.save();

    onlineUsers = onlineUsers.map((user) =>
      user._id === oluvchi._id.toString() ? { ...user, role: data.role } : user
    );

    io.emit("users", onlineUsers);
  });

  // ✅ DISCONNECT
  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.map((user) =>
      user.socketId === socket.id ? { ...user, status: false } : user
    );

    io.emit("users", onlineUsers);
    console.log(`❌ Foydalanuvchi chiqdi: ${socket.id}`);
  });

  // ✅ MUTE
  socket.on("mute", async ({ userID, selectedUser }) => {
    console.log("DEBUG MUTE: ", { userID, selectedUser });

    const beruvchi = onlineUsers.find((user) => user._id === userID);
    const oluvchi = onlineUsers.find((user) => user._id === selectedUser);
    console.log({ beruvchi, oluvchi });

    if (!beruvchi || !oluvchi) {
      return socket.emit("admin_notification", {
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }
    if (oluvchi.role === "owner") {
      return socket.emit("admin_notification", {
        success: false,
        message: "Ownerni mute qilish mumkin emas",
      });
    }
    if (!["owner", "admin", "moderator"].includes(beruvchi.role)) {
      return socket.emit("admin_notification", {
        success: false,
        message: "Ruxsat yo‘q",
      });
    }
    if (oluvchi.isMute) {
      return socket.emit("admin_notification", {
        success: false,
        message: "Foydalanuvchi allaqachon mute qilingan",
      });
    }
    oluvchi.isMute = true;
    await oluvchi.save();
    console.log(oluvchi);

    onlineUsers = onlineUsers.map((user) =>
      user._id === oluvchi._id.toString() ? { ...user, isMute: true } : user
    );
    io.to(oluvchi.socketId).emit("mute_result", {
      success: true,
      message: "Siz admin tomonidan mute qilindingiz",
      user: oluvchi,
    });
    io.emit("users", onlineUsers);
  });

  // ✅ UNMUTE
  socket.on("unmute", async ({ userID, selectedUser }) => {
    const beruvchi = onlineUsers.find((user) => user._id === userID);
    const oluvchi = onlineUsers.find((user) => user._id === selectedUser);
console.log("Debug unmute: ",{ beruvchi, oluvchi });
    if (!beruvchi || !oluvchi) {
      return socket.emit("admin_notification", {
        success: false,
        message: "Foydalanuvchi topilmadi",
      });
    }
    if (!oluvchi.isMute) {
      return socket.emit("admin_notification", {
        success: false,
        message: "Foydalanuvchi mute qilingan emas",
      });
    }
    if (!["owner", "admin", "moderator"].includes(beruvchi.role)) {
      return socket.emit("admin_notification", {
        success: false,
        message: "Ruxsat yo‘q",
      });
    }
    oluvchi.isMute = false;
    await oluvchi.save();
   console.log(oluvchi);
    onlineUsers = onlineUsers.map((user) =>
      user._id === oluvchi._id.toString() ? { ...user, isMute: false } : user
    );
    io.to(oluvchi.socketId).emit("unmute_result", {
      success: true,
      message: "Siz admin tomonidan unmute qilindingiz",
      user: oluvchi,
    });
    io.emit("users", onlineUsers);
  });
});

app.get("/", (req, res) => {
  res.send("💬 Real-Time Chat Backend is Running...");
});

server.listen(8000, () => {
  console.log("🚀 Server listening on http://localhost:8000");
});
