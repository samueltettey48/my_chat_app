

import { Router } from "express";
import {
  searchUsers,
  getUserById,
  updateStatus,
  getCurrentUser,
} from "../controllers/userController.js";

import authMiddleware from "../middlewares/authMiddleware.js";
import activityMiddleware from "../middlewares/activityMiddleware.js";

const userRouter = Router();

// 🔐 Apply middlewares globally (cleaner)
userRouter.use(authMiddleware);
userRouter.use(activityMiddleware);


// ======================================================
// 🔍 SEARCH USERS (with pagination)
// GET /api/users/search?query=...&page=1&limit=10
// ======================================================
userRouter.get("/search", searchUsers);


// ======================================================
// 👤 GET CURRENT USER (VERY IMPORTANT)
// GET /api/users/me
// ======================================================
userRouter.get("/me", getCurrentUser);


// ======================================================
// 🟢 UPDATE ONLINE STATUS
// PATCH /api/users/status
// ======================================================
userRouter.patch("/status", updateStatus);


// ======================================================
// 👤 GET USER BY ID
// GET /api/users/:id
// ======================================================
userRouter.get("/:id", getUserById);


export default userRouter;