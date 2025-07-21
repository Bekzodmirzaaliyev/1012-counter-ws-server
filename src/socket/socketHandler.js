const User = require("../models/userModel");

const {
  handleSendMessage,
  handleDisconnect,
} = require("../controllers/chatController");

const {
  handleCall,
  handleOffer,
  handleAnswer,
  handleCandidate,
  handleCallCancel,
  handleCallRejected,
  handleCallAccepted,
  handleCallEnded,
} = require("../controllers/callController");

const {
  handleBan,
  handleUnban,
  handleMute,
  handleUnmute,
  handleSetRole,
} = require("../controllers/adminController");

// Global user list (RAM)
let onlineUsers = [];

const socketHandler = async (io) => {
  // Boshlanishda barcha userlarni olish
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
    socketId: null,
  }));

  io.on("connection", (socket) => {
    console.log(`🔌 Ulandi: ${socket.id}`);

    // ✅ Client ulanayotganda
    socket.on("connected", async (user) => {
      // Avval eski socketId ni o‘chir
      onlineUsers = onlineUsers.filter((u) => u._id !== user._id);

      onlineUsers.push({
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        socketId: socket.id, // MUHIM: socketId saqlanadi!
        role: user.role,
        status: true,
      });

      io.emit("users", onlineUsers); // frontga jonatamiz
    });
    // ✅ Xabar jo‘natish
    socket.on("send_message", (data) =>
      handleSendMessage(socket, data, onlineUsers, io)
    );

    // ✅ Admin funksiyalar
    socket.on("ban", (data) => handleBan(socket, data, onlineUsers, io));
    socket.on("unban", (data) => handleUnban(socket, data, onlineUsers, io));
    socket.on("mute", (data) => handleMute(socket, data, onlineUsers, io));
    socket.on("unmute", (data) => handleUnmute(socket, data, onlineUsers, io));
    socket.on("setAdmin", (data) =>
      handleSetRole(socket, data, onlineUsers, io)
    );

    // ✅ Call funksiyalar (WebRTC)
    socket.on("call", (data) => handleCall(io, onlineUsers, data, socket));
    socket.on("make_offer", (data) => handleOffer(io, data));
    socket.on("make_answer", (data) => handleAnswer(io, data));
    socket.on("ice_candidate", (data) => handleCandidate(io, data));
    socket.on("cancel_call", (data) => handleCallCancel(io, data));
    socket.on("reject_call", (data) => handleCallRejected(io, data));
    socket.on("accept_call", (data) => handleCallAccepted(io, data));
    socket.on("end_call", (data) => handleCallEnded(io, data));

    // ✅ Ajralish
    socket.on("disconnect", () => handleDisconnect(socket, onlineUsers, io));
  });
};

module.exports = socketHandler;
