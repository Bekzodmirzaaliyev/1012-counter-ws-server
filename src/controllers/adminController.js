const User = require("../models/userModel");

const emitError = (socket, message) => {
  socket.emit("admin_notification", {
    success: false,
    message,
  });
};

const emitSuccess = (socket, message) => {
  socket.emit("admin_notification", {
    success: true,
    message,
  });
};

// ✅ BAN
const handleBan = async (socket, { userID, selectedUser, reason }, onlineUsers, io) => {
  const admin = await User.findById(userID);
  const target = await User.findById(selectedUser);

  if (!admin || !target) return emitError(socket, "Foydalanuvchi topilmadi");
  if (!["owner", "admin"].includes(admin.role)) return emitError(socket, "Sizda ruxsat yo‘q");
  if (target.role === "owner") return emitError(socket, "Ownerni ban qilib bo‘lmaydi");
  if (target.isBan) return emitError(socket, "User allaqachon ban qilingan");

  target.isBan = true;
  await target.save();

  onlineUsers.forEach(user => {
    if (user._id === target._id.toString()) user.isBan = true;
  });

  io.emit("BanResult", onlineUsers);

  const found = onlineUsers.find(u => u._id === target._id.toString());
  if (found?.socketId) {
    io.to(found.socketId).emit("Ban_Result_reciever", {
      success: false,
      message: `Sizga ${admin.username} tomonidan ban berildi. Sabab: ${reason}`,
      user: target,
    });
  }
};

// ✅ UNBAN
const handleUnban = async (socket, { userID, selectedUser }, onlineUsers, io) => {
  const admin = await User.findById(userID);
  const target = await User.findById(selectedUser);

  if (!admin || !target) return emitError(socket, "Foydalanuvchi topilmadi");
  if (!["owner", "admin"].includes(admin.role)) return emitError(socket, "Sizda ruxsat yo‘q");
  if (!target.isBan) return emitError(socket, "User ban qilinmagan");

  target.isBan = false;
  await target.save();

  onlineUsers.forEach(user => {
    if (user._id === target._id.toString()) user.isBan = false;
  });

  io.emit("BanResult", onlineUsers);

  const found = onlineUsers.find(u => u._id === target._id.toString());
  if (found?.socketId) {
    io.to(found.socketId).emit("Ban_Result_reciever", {
      success: true,
      message: `Sizga ${admin.username} tomonidan unban berildi.`,
      user: target,
    });
  }
};

// ✅ MUTE
const handleMute = async (socket, { userID, selectedUser }, onlineUsers, io) => {
  const admin = await User.findById(userID);
  const target = await User.findById(selectedUser);

  if (!admin || !target) return emitError(socket, "Foydalanuvchi topilmadi");
  if (!["owner", "admin", "moderator"].includes(admin.role)) return emitError(socket, "Ruxsat yo‘q");
  if (target.role === "owner") return emitError(socket, "Ownerni mute qilish mumkin emas");
  if (target.isMute) return emitError(socket, "Foydalanuvchi allaqachon mute qilingan");

  target.isMute = true;
  await target.save();

  onlineUsers.forEach(user => {
    if (user._id === target._id.toString()) user.isMute = true;
  });

  io.to(target.socketId).emit("mute_result", {
    success: true,
    message: "Siz admin tomonidan mute qilindingiz",
    user: target,
  });
  io.emit("users", onlineUsers);
};

// ✅ UNMUTE
const handleUnmute = async (socket, { userID, selectedUser }, onlineUsers, io) => {
  const admin = await User.findById(userID);
  const target = await User.findById(selectedUser);

  if (!admin || !target) return emitError(socket, "Foydalanuvchi topilmadi");
  if (!["owner", "admin", "moderator"].includes(admin.role)) return emitError(socket, "Ruxsat yo‘q");
  if (!target.isMute) return emitError(socket, "Foydalanuvchi mute qilinmagan");

  target.isMute = false;
  await target.save();

  onlineUsers.forEach(user => {
    if (user._id === target._id.toString()) user.isMute = false;
  });

  io.to(target.socketId).emit("unmute_result", {
    success: true,
    message: "Sizga unmute berildi",
    user: target,
  });
  io.emit("users", onlineUsers);
};

// ✅ SET ROLE (Admin, Moderator, Vip, User)
const handleSetRole = async (socket, data, onlineUsers, io) => {
  const giver = await User.findById(data.userID);
  const receiver = await User.findById(data.selectedUser);

  if (!giver || !receiver) return emitError(socket, "Foydalanuvchi topilmadi");
  if (!["owner", "admin"].includes(giver.role)) return emitError(socket, "Sizda ruxsat yo‘q");
  if (!["user", "admin", "moderator", "vip"].includes(data.role)) return emitError(socket, "Role mavjud emas");
  if (receiver.role === "owner") return emitError(socket, "Ownerning role o‘zgartirib bo‘lmaydi");
  if (receiver.role === data.role) return emitError(socket, `U allaqachon ${data.role}`);

  receiver.role = data.role;
  await receiver.save();

  onlineUsers.forEach(user => {
    if (user._id === receiver._id.toString()) user.role = data.role;
  });

  emitSuccess(socket, `Userga yangi role berildi: ${data.role}`);
  io.emit("users", onlineUsers);
};

module.exports = {
  handleBan,
  handleUnban,
  handleMute,
  handleUnmute,
  handleSetRole,
};
