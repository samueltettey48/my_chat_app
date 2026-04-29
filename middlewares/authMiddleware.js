

import jwt from "jsonwebtoken";
import prisma from "../config/db.js";

// ======================================================
// 🔐 AUTHENTICATE USER
// ======================================================
export const isAuthenticated = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 🔍 Check header format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authorization token missing or malformed",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 🔐 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔍 Fetch user from DB (important for real-time data)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        isOnline: true,
        lastSeen: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // ✅ Attach user to request
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};


// ======================================================
// 🔐 OPTIONAL: ADMIN CHECK (FUTURE USE)
// ======================================================
export const isAdmin = (req, res, next) => {
  // ⚠️ You currently don't store global roles in User model
  // This is just for future expansion

  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
};
export default { isAuthenticated, isAdmin };