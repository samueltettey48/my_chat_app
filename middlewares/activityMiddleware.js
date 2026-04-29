
import prisma from "../config/db.js";

// 🔥 simple cache to reduce DB spam (in-memory throttle)
const lastUpdateMap = new Map();

const activityMiddleware = async (req, res, next) => {
  try {
    if (!req.user) return next();

    const userId = req.user.id;
    const now = Date.now();

    // ⛔ throttle updates (only update every 30 seconds)
    const lastUpdate = lastUpdateMap.get(userId);

    if (lastUpdate && now - lastUpdate < 30 * 1000) {
      return next();
    }

    lastUpdateMap.set(userId, now);

    // ✅ update user activity
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastSeen: new Date(),
        isOnline: true,
      },
    });

    next();
  } catch (error) {
    console.error("Activity error:", error.message);
    next(); // never block requests
  }
};

export default activityMiddleware;