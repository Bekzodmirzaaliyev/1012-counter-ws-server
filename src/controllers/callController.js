// ✅ Kiruvchi qo‘ng‘iroq yuborish
// ✅ Kiruvchi qo‘ng‘iroq yuborish (to‘liq, barqaror versiya)
const handleCall = (io, onlineUsers, data, socket) => {
  // 1. Callee ID ni ajratib olish (object yoki string bo'lishi mumkin)
  const targetId = typeof data.to === "object" ? data.to._id : data.to;
  const targetUser = onlineUsers.find((u) => u._id === targetId);

  console.log("📞 Qo‘ng‘iroq ketyapti:", {
    caller: data.from?.username,
    calleeId: targetId,
    found: !!targetUser,
    calleeSocket: targetUser?.socketId || null,
  });

  // 2. Agar target topilmasa yoki offline bo‘lsa
  if (!targetUser || !targetUser.socketId) {
    return socket.emit("admin_notification", {
      success: false,
      message: "Foydalanuvchi offline yoki mavjud emas",
    });
  }

  // 3. Targetga qo‘ng‘iroq yuborish
  io.to(targetUser.socketId).emit("incoming_call", {
    from: data.from, // Kimdan qo‘ng‘iroq
    socketId: socket.id, // Caller socketId (signal uchun)
  });

  console.log(
    `📞 Qo‘ng‘iroq yuborildi: ${data.from?.username} ➝ ${targetUser.username}`
  );
};

// ✅ WebRTC: offer yuborish
const handleOffer = (io, data) => {
  io.to(data.to).emit("offer_received", {
    offer: data.offer,
    from: data.from,
  });

  console.log("📤 Offer sent from", data.from.username);
};

// ✅ WebRTC: answer yuborish
const handleAnswer = (io, data) => {
  io.to(data.to).emit("answer_received", {
    answer: data.answer,
    from: data.from,
  });

  console.log("📥 Answer sent from", data.from.username);
};

// ✅ ICE candidate yuborish
const handleCandidate = (io, data) => {
  io.to(data.to).emit("ice_candidate_received", {
    candidate: data.candidate,
    from: data.from,
  });

  console.log("❄ ICE Candidate forwarded from", data.from.username);
};

// ✅ Call bekor qilish (caller tomonidan)
const handleCallCancel = (io, data) => {
  io.to(data.to).emit("call_cancelled", {
    from: data.from,
    message: "Qo‘ng‘iroq bekor qilindi",
  });

  console.log("❌ Call cancelled by", data.from.username);
};

// ✅ Call rad etildi (callee tomonidan)
const handleCallRejected = (io, data) => {
  io.to(data.to).emit("call_rejected", {
    from: data.from,
    message: "Foydalanuvchi qo‘ng‘iroqni rad etdi",
  });

  console.log("⛔ Call rejected by", data.from.username);
};

// ✅ Call qabul qilindi
const handleCallAccepted = (io, data) => {
  io.to(data.to).emit("call_accepted", {
    from: data.from,
    message: "Foydalanuvchi qo‘ng‘iroqni qabul qildi",
  });

  console.log("✅ Call accepted by", data.from.username);
};

// ✅ Call yakunlandi (ikkala tomon uchun)
const handleCallEnded = (io, data) => {
  io.to(data.to).emit("call_ended", {
    from: data.from,
    message: "Qo‘ng‘iroq tugatildi",
  });

  console.log("📴 Call ended by", data.from.username);
};

module.exports = {
  handleCall,
  handleOffer,
  handleAnswer,
  handleCandidate,
  handleCallCancel,
  handleCallRejected,
  handleCallAccepted,
  handleCallEnded,
};
