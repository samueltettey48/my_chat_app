
// importing dependencies
import "dotenv/config";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import transporter from "./utils/mailer.js";
 // ✅ ADD THIS

// importing routes
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";


// 🔥 DEBUG ENV VARIABLES
// console.log("EMAIL_USER:", process.env.EMAIL_USER);
// console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

// ✅ create app
const app = express();

// ✅ middleware
app.use(express.json());

// ✅ routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

// ✅ create HTTP server
const server = http.createServer(app);

// ✅ socket.io setup
const io = new Server(server, {
  cors: { origin: "*" }
});

// make io available globally
app.use((req, res, next) => {
  req.io = io;
  next();
});

// socket connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ✅ START MAILER CONNECTION ON SERVER START
transporter.verify()
  .then(() => console.log("✅ Mail server ready"))
  .catch((err) => console.error("❌ Mail server error:", err));

// start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});