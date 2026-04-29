

export const isGroupAdmin = async (req, res, next) => {
  const { conversationId } = req.params;
  const userId = req.user.id;

  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId: Number(conversationId), userId },
  });

  if (!participant || participant.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};