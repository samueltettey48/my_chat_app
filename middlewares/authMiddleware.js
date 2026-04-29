
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    // 🔐 verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔍 fetch real user from database (IMPORTANT FIX)
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
      return res.status(401).json({ message: "User not found" });
    }

    // 👤 attach full user object to request
    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;