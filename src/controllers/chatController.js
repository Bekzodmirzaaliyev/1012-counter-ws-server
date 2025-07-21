const messageModel = require("../models/messageModel");
const User = require("../models/userModel");

// ✅ YUBORISH
const handleSendMessage = async (socket, data, onlineUsers, io) => {
  const receiver = onlineUsers.find((user) => user._id === data.to);
  const sender = onlineUsers.find((user) => user._id === data.from);

  if (!sender || sender?.isBan) {
    return socket.emit("admin_notification", {
      success: false,
      message: "Siz bloklangansiz yoki mavjud emassiz.",
    });
  }

  if (sender.isMute) {
    return socket.emit("admin_notification", {
      success: false,
      message: "Siz mute qilingansiz",
    });
  }

  const saved = await messageModel.create({
    from: data.from,
    to: data.to,
    text: data.text,
  });

  const timeNow = {
    day: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
  };

  // ✅ Agar receiver online bo‘lsa
  if (receiver?.socketId) {
    io.to(receiver.socketId).emit("receive_message", {
      from: data.from,
      to: data.to,
      text: data.text,
      date: timeNow,
    });
  } else {
    // ❌ Offline userga trigger
    socket.emit("admin_notification", {
      success: true,
      message: "User hozir offline, lekin xabar yetkazildi.",
    });

    // 🔔 (istalgancha kengaytirsa bo‘ladi: localStorage, push notification, unread badge va h.k.)
    io.to(socket.id).emit("offline_message", {
      to: data.to,
      savedMessage: {
        text: data.text,
        date: timeNow,
      },
    });
  }
};

// ✅ DISCONNECT
const handleDisconnect = (socket, onlineUsers, io) => {
  const updated = onlineUsers.map((user) => {
    if (user.socketId === socket.id) {
      return { ...user, status: false, socketId: null };
    }
    return user;
  });

  // Local array update
  onlineUsers.splice(0, onlineUsers.length, ...updated);

  io.emit("users", onlineUsers);
  console.log(`❌ Foydalanuvchi chiqdi: ${socket.id}`);
};

module.exports = {
  handleSendMessage,
  handleDisconnect,
};
