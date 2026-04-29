

import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  updateProfilePicture,
  updateStatus,
} from "../controllers/profileController.js";

import { isAuthenticated } from "../middlewares/authMiddleware.js";

const profileRouter = Router();

profileRouter.use(isAuthenticated);

// WhatsApp-like personal actions
profileRouter.get("/me", getMyProfile);
profileRouter.put("/me", updateMyProfile);
profileRouter.put("/me/avatar", updateProfilePicture);
profileRouter.put("/me/status", updateStatus);

export default profileRouter;