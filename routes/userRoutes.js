

import { Router } from "express";
import {
  searchUsers,
  getUserById,
  updateStatus
} from "../controllers/userController.js";

import authMiddleware from "../middlewares/authMiddleware.js";
import activityMiddleware from "../middlewares/activityMiddleware.js";

const userRouter = Router();

// Search users
userRouter.get(
  "/search",
  authMiddleware,
  activityMiddleware,
  searchUsers
);

// Get single user
userRouter.get(
  "/:id",
  authMiddleware,
  activityMiddleware,
  getUserById
);

// Update online status
userRouter.patch(
  "/status",
  authMiddleware,
  activityMiddleware,
  updateStatus
);

export default userRouter;