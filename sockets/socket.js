// sockets/socket.js

export const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // ✅ Join conversation room
    socket.on("joinConversation", (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });

    // =========================
    // 🔥 TYPING INDICATOR
    // =========================
    socket.on("typing", ({ conversationId, user }) => {
      socket.to(`conversation_${conversationId}`).emit("userTyping", {
        user,
      });
    });

    socket.on("stopTyping", ({ conversationId, user }) => {
      socket.to(`conversation_${conversationId}`).emit("userStopTyping", {
        user,
      });
    });

    // =========================
    // 🔥 ONLINE / OFFLINE (OPTIONAL UPGRADE)
    // =========================
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};