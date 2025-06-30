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
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on("connected", (userData) => {
    console.log("🔥 Connected user: ", userData);
    onlineUsers = onlineUsers.map((user) =>
      user._id === userData._id
        ? { ...user, status: true, socketId: socket.id }
        : user
    );
    io.emit("users", onlineUsers);

    socket.on("ban", async ({ userID, selectedUser, reason }) => {
      console.log("data ban:", { userID, selectedUser, reason });

      const beruvchi = await User.findById(userID);
      const oluvchi = await User.findById(selectedUser);

      if (!beruvchi || !oluvchi) {
        console.log("Beruvchi yoki oluchi topilmadi");
        return socket.emit("admin_notification", {
          success: false,
          message: "Foydalanuvchi topilmadi",
        });
      }
      if (!["owner", "admin"].includes(beruvchi.role)) {
        console.log("owner yoki admin dostupi yoq");
        return socket.emit("admin_notification", {
          success: false,
          message: "Sizda ruxsat yo'q",
        });
      }
      if (["owner"].includes(oluvchi.role)) {
        console.log("ownerga ban berib bolmaydi");
        return socket.emit("admin_notification", {
          success: false,
          message: "Ownerga ban berib bolmaydi",
        });
      }
      if (oluvchi.isBan) {
        console.log("bu user allaqchon ban bolgan");
        return socket.emit("admin_notification", {
          success: false,
          message: "Bu user allaqachon ban bolgan",
        });
      }

      oluvchi.isBan = true;
      await oluvchi.save();

      console.log("LAHM GEY: ", { oluvchi });

      onlineUsers = onlineUsers.map((user) =>
        user._id === oluvchi._id.toString() ? { ...user, isBan: true } : user
      );
      io.emit("BanResult", onlineUsers);
      console.log("SOCKET ID BAN: ", oluvchi.socketId);
      const filter = onlineUsers.find((user) => user._id === oluvchi._id);
      io.to().emit("Ban_Result_reciever", {
        success: false,
        message: `Sizga ${beruvchi.username} tomonidan ban berildi sabab: ${reason}`,
        user: oluvchi,
      });
    });

    socket.on("unban", async ({ userID, selectedUser }) => {
      try {
        const beruvchi = await User.findById(userID);
        const oluvchi = await User.findById(selectedUser);

        if (!beruvchi || !oluvchi) {
          console.log("Beruvchi yoki oluchi topilmadi");
          return socket.emit("admin_notification", {
            success: false,
            message: "Foydalanuvchi topilmadi",
          });
        }
        if (!["owner", "admin"].includes(beruvchi.role)) {
          console.log("owner yoki admin dostupi yoq");
          return socket.emit("admin_notification", {
            success: false,
            message: "Sizda ruxsat yo'q",
          });
        }
        if (["owner"].includes(oluvchi.role)) {
          console.log("ownerga ban berib bolmaydi");
          return socket.emit("admin_notification", {
            success: false,
            message: "Ownerga ban berib bolmaydi",
          });
        }
        if (!oluvchi.isBan) {
          console.log("bu user allaqchon blockdan chiqgan");
          return socket.emit("admin_notification", {
            success: false,
            message: "Bu user allaqachon ban bolgan",
          });
        }

        oluvchi.isBan = false;
        await oluvchi.save();

        onlineUsers = onlineUsers.map((user) =>
          user._id === oluvchi._id.toString() ? { ...user, isBan: false } : user
        );

        io.emit("BanResult", onlineUsers);

        console.log("SOCKET ID UNBAN: ", oluvchi.socketId);
        io.to(oluvchi.socketId).emit("Ban_Result_reciever", {
          success: true,
          message: `Sizga ${beruvchi.username} tomonidan unban qilindi`,
          user: oluvchi,
        });
      } catch (e) {
        console.log("F Socket: ", e);
      }
    });
  });

  socket.on("send_message", async (data) => {
    const receiver = onlineUsers.find((user) => user._id === data.to);

    const newMessage = await messageModel.create({
      from: data.from,
      to: data.to,
      text: data.text,
    });
    console.log("DATE: ", { date: new Date().toLocaleTimeString() });
    console.log("RECEIVER: ", receiver);
    console.log("RECEIVER ID: ", receiver.socketId);
    if (receiver) {
      io.to(receiver.socketId).emit("receive_message", {
        from: data?.from,
        to: data?.to,
        text: data?.text,
        date: {
          day: new Date().toLocaleDateString(), // 13.06.2025
          time: new Date().toLocaleTimeString(), // 15:19
        },
      });
    }
  });

  socket.on("setAdmin", async (data) => {
    try {
      console.log(data);

      const beruvchi = await userModel.findById(data.userID);
      const oluvchi = await userModel.findById(data.selectedUser);

      if (!oluvchi || !beruvchi) {
        return socket.emit("admin_notification", {
          success: false,
          message: "Foydalanuvchi topilmadi",
        });
      }

      if (!["user", "admin", "moderator", "vip"].includes(data.role)) {
        return socket.emit("admin_notification", {
          success: false,
          message: "Notog'ri Role tanlandi",
        });
      }

      if (!["owner", "admin"].includes(beruvchi.role)) {
        return socket.emit("admin_notification", {
          success: false,
          message: "Sizda ruxsat yoq",
        });
      }

      if (oluvchi.role === "owner") {
        return socket.emit("admin_notification", {
          success: false,
          message: "Owner rolini o'zgartirish mumkin emas!",
        });
      }

      if (oluvchi.role === data.role) {
        console.log("U foydalanuvchi allaqachon");
        return socket.emit("admin_notification", {
          success: false,
          message: `U foydalanuvchi allaqachon ${data.role} bo‘lgan`,
        });
      }

      oluvchi.role = data.role;
      await oluvchi.save();

      onlineUsers = onlineUsers.map((user) =>
        user._id === oluvchi._id.toString()
          ? { ...user, role: data.role }
          : user
      );

      io.emit("users", onlineUsers);
    } catch (e) {
      console.log("Socket error: ", e);
    }
  });
});

app.get("/", (req, res) => {
  res.send("💬 Real-Time Chat Backend is Running...");
});

server.listen(8000, () => {
  console.log("🚀 Server listening on http://localhost:8000");
});
