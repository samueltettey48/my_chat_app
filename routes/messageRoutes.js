

import express from "express";

import {
  sendMessage,
 
  getMessages,
   deleteMessage,
   editMessage,
   markAsDelivered,
} from "../controllers/messageController.js";

import authMiddleware from "../middlewares/authMiddleware.js";
import activityMiddleware from "../middlewares/activityMiddleware.js";

const router = express.Router();


// ----------------- ALL ROUTES PROTECTED -----------------
router.use(authMiddleware);
router.use(activityMiddleware);


// ----------------- SEND MESSAGE -----------------
router.post("/", sendMessage);


// ----------------- GET MESSAGES IN CONVERSATION -----------------
router.get("/:conversationId", getMessages);


// // ----------------- DELETE MESSAGE (SOFT DELETE) -----------------
 router.delete("/:messageId", deleteMessage);


 
// // ✏️ Edit message
router.patch("/:messageId",editMessage);

// // ✅ Mark as delivered
router.patch("/delivered",markAsDelivered);
export default router;


// import express from "express";
// import {
//   sendMessage,
//   getMessages,
//   deleteMessage,
//   editMessage,
//   markAsDelivered,
// } from "../controllers/messageController.js";

// import authMiddleware from "../middlewares/authMiddleware.js";

// const router = express.Router();

// // 📩 Send message
// router.post("/", authMiddleware, sendMessage);

// // 📥 Get messages (with pagination support)
// router.get("/:conversationId", authMiddleware, getMessages);


// // 🗑 Soft delete
// router.delete("/:messageId", authMiddleware, deleteMessage);

// export default router;