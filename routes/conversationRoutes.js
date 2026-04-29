

import { Router } from "express";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

import {
  createConversation,
  getUserConversations,
  createGroupConversation,
  getConversation,
  addMember,
  removeMember,
  makeAdmin,
  updateUserRole,
  markAsRead,
} from "../controllers/conversationController.js";

const router = Router();

// ======================================================
// 🔥 1-TO-1 CONVERSATIONS
// ======================================================

// Create or get private chat
router.post("/private", isAuthenticated, createConversation);

// Get all conversations for logged-in user
router.get("/", isAuthenticated, getUserConversations);

// Get single conversation with messages
router.get("/:id", isAuthenticated, getConversation);


// ======================================================
// 🔥 GROUP CONVERSATIONS
// ======================================================

// Create group
router.post("/group", isAuthenticated, createGroupConversation);


// ======================================================
// 🔥 GROUP MANAGEMENT (ADMIN)
// ======================================================

// Add member
router.post("/group/add-member", isAuthenticated, addMember);

// Remove member
router.post("/group/remove-member", isAuthenticated, removeMember);

// Promote user to admin
router.post("/group/make-admin", isAuthenticated, makeAdmin);

// Update role (admin/member)
router.put("/group/update-role", isAuthenticated, updateUserRole);


// ======================================================
// 🔥 MESSAGE FEATURES
// ======================================================

// Mark messages as read
router.post("/read", isAuthenticated, markAsRead);


export default router;