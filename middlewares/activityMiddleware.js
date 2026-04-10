

import prisma from "../config/db.js";

const activityMiddleware = async (req, res, next) => {
  try {
    if (req.user) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          lastSeen: new Date(),
          isOnline: true,
        },
      });
    }
    next();
  } catch (error) {
    console.error("Activity error:", error.message);
    next(); // don't block request
  }
};

export default activityMiddleware;