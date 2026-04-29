import { Router } from "express";
import {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  googleAuth,
} from "../controllers/authController.js";

import {isAuthenticated} from "../middlewares/authMiddleware.js";
import activityMiddleware from "../middlewares/activityMiddleware.js";
import transporter from "../utils/mailer.js"; // ✅ ADD THIS

const authRouter = Router();

// ----------------- PUBLIC ROUTES -----------------

// Signup (create user in Prisma User table)
authRouter.post("/signup", signup);

// Login (returns JWT for Prisma User)
authRouter.post("/login", login);

// Google OAuth login
authRouter.post("/google", googleAuth);

// Forgot password (Prisma resetToken flow)
authRouter.post("/forgot-password", forgotPassword);

// Reset password (Prisma resetToken validation)
authRouter.post("/reset-password", resetPassword);

// ✅ TEST EMAIL ROUTE (ADD HERE)
authRouter.get("/test-email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: `"Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Test Email",
      html: "<h2>Email is working ✅</h2>",
    });

    res.send("Email sent successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Email failed");
  }
});

// ----------------- PROTECTED ROUTES -----------------

// Logout (requires valid JWT user)
authRouter.post(
  "/logout",
  isAuthenticated,
  activityMiddleware,
  logout
);

export default authRouter;