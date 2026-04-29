
import { Router } from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import activityMiddleware from "../middlewares/activityMiddleware.js";

import {
  createConversation,
  getUserConversations,
  getConversation,
  removeMember,
  markAsRead,
  createGroupConversation
} from "../controllers/conversationController.js";

const router = Router();


// ----------------- ALL ROUTES PROTECTED -----------------
router.use(authMiddleware);
router.use(activityMiddleware);


// ----------------- 1-TO-1 CONVERSATION -----------------
router.post("/", createConversation);

// // ----------------- GROUP CHAT -----------------
 router.post("/group", createGroupConversation);


// ----------------- GET CONVERSATIONS -----------------
router.get("/", getUserConversations);


// // ----------------- GET SINGLE CONVERSATION -----------------
 router.get("/:id", getConversation);


// // ----------------- READ RECEIPTS -----------------
router.patch("/read", markAsRead);


// // ----------------- GROUP MANAGEMENT -----------------

router.post("/remove-member", removeMember);

export default router;