

import { Router } from "express";
import {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  googleAuth
} from "../controllers/authController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const authRouter = Router();

// Signup
authRouter.post("/signup", signup);

// Login
authRouter.post("/login", login);

// Logout (protected)
authRouter.post("/logout", authMiddleware, logout);

// Forgot password
authRouter.post("/forgot-password", forgotPassword);

// Reset password
authRouter.post("/reset-password/:token", resetPassword);

// Google login
authRouter.post("/google", googleAuth);

export default authRouter;