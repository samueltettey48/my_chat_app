

// =======================
// 🔥 IMPORTS
// =======================
import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import transporter from "./utils/mailer.js";
import { setupSocket } from "./sockets/socket.js";

// =======================
// 🔥 ROUTES
// =======================
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

// =======================
// ✅ CREATE APP
// =======================
const app = express();
const server = http.createServer(app);

// =======================
// ✅ MIDDLEWARE
// =======================
app.use(express.json());

// =======================
// 🔥 SOCKET.IO SETUP
// =======================
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ✅ Make io accessible in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ Initialize all socket logic from socket.js
setupSocket(io);

// =======================
// ✅ ROUTES
// =======================
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

// =======================
// 📧 MAILER CHECK
// =======================
transporter
  .verify()
  .then(() => console.log("✅ Mail server ready"))
  .catch((err) => console.error("❌ Mail server error:", err));

// =======================
// 🚀 START SERVER
// =======================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});