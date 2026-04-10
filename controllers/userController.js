



import prisma from "../config/db.js";

// ----------------- SEARCH USERS -----------------
export const searchUsers = async (req, res) => {
  const { query } = req.query;

  try {
    const users = await prisma.user.findMany({
      where: {
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
      select: {
        id: true,
        name: true,
        email: true,
        isOnline: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error searching users" });
  }
};

// ----------------- GET USER BY ID -----------------
export const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        email: true,
        isOnline: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching user" });
  }
};

// ----------------- UPDATE USER ONLINE STATUS -----------------
export const updateStatus = async (req, res) => {
  const userId = req.user.id; // from authMiddleware
  const { isOnline } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isOnline },
      select: {
        id: true,
        name: true,
        isOnline: true,
      },
    });

    res.json({
      message: "Status updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating status" });
  }
};
