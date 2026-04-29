import prisma from "../prismaClient.js";

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.body;

    await prisma.blockedUser.create({
      data: {
        blockerId: req.user.id,
        blockedId: userId,
      },
    });

    res.json({ message: "User blocked" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};