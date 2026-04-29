import prisma from '../prismaClient.js';

export const createStory = async (req, res) => {
  try {
    const { mediaUrl, caption } = req.body;

    const story = await prisma.story.create({
      data: {
        userId: req.user.id,
        mediaUrl,
        caption,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    res.json(story);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};