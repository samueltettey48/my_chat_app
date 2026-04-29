
import prisma from "../config/db.js";


// ======================================================
// 🔥 1. SEARCH USERS (WITH PAGINATION)
// ======================================================
export const searchUsers = async (req, res) => {
  const { query, page = 1, limit = 10 } = req.query;
  const currentUserId = req.user.id;

  try {
    if (!query || query.trim() === "") {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            NOT: { id: currentUserId }, // ❌ exclude self
          },
          {
            OR: [
              {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            ],
          },
        ],
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),

      select: {
        id: true,
        name: true,
        email: true,
        isOnline: true,
        lastSeen: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error searching users" });
  }
};


// ======================================================
// 🔥 2. GET USER BY ID (CLEAN + SAFE)
// ======================================================
export const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const userId = Number(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isOnline: true,
        lastSeen: true,

        // 🔥 show only relevant conversation info
        participants: {
          select: {
            role: true,
            joinedAt: true,
            conversation: {
              select: {
                id: true,
                isGroup: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching user" });
  }
};


// ======================================================
// 🔥 3. UPDATE ONLINE STATUS
// ======================================================
export const updateStatus = async (req, res) => {
  const userId = req.user.id;
  const { isOnline } = req.body;

  try {
    if (typeof isOnline !== "boolean") {
      return res.status(400).json({
        message: "isOnline must be true or false",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline,
        lastSeen: isOnline ? null : new Date(),
      },
      select: {
        id: true,
        name: true,
        isOnline: true,
        lastSeen: true,
      },
    });

    // 🔥 emit real-time update (Socket.io ready)
    if (req.io) {
      req.io.emit("userStatusChanged", {
        userId,
        isOnline,
        lastSeen: updatedUser.lastSeen,
      });
    }

    res.json({
      message: "Status updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating status" });
  }
};


// ======================================================
// 🔥 4. GET CURRENT USER PROFILE
// ======================================================
export const getCurrentUser = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};