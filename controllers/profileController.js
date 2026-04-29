
import prisma from "../config/prisma.js";

// Get my profile
export const getMyProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Update profile
export const updateMyProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, bio },
    });

    res.json({ message: "Profile updated", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Update avatar
export const updateProfilePicture = async (req, res) => {
  try {
    const { avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar },
    });

    res.json({ message: "Avatar updated", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Update status
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { status },
    });

    res.json({ message: "Status updated", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};