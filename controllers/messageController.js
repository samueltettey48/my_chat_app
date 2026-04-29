import prisma from "../config/db.js";

// ----------------- SEND MESSAGE -----------------
export const sendMessage = async (req, res) => {
  const { conversationId, content, mediaUrl, type } = req.body;
  const senderId = req.user.id;

  try {
    if (!conversationId || (!content && !mediaUrl)) {
      return res.status(400).json({
        message: "conversationId and content/media are required",
      });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: Number(conversationId) },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: Number(conversationId),
        userId: senderId,
      },
    });

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not part of this conversation",
      });
    }

    const message = await prisma.message.create({
      data: {
        content: content || "",
        mediaUrl,
        type: type || "TEXT",
        conversationId: Number(conversationId),
        senderId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId: Number(conversationId) },
    });

    await prisma.messageStatus.createMany({
      data: participants.map((p) => ({
        messageId: message.id,
        userId: p.userId,
        status: "sent",
      })),
    });

    if (req.io) {
      req.io.to(`conversation_${conversationId}`).emit("receiveMessage", message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ----------------- GET MESSAGES -----------------
export const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.user.id;

  try {
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: Number(conversationId),
        userId,
      },
    });

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: Number(conversationId),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        status: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      skip: (page - 1) * limit,
      take: Number(limit),
    });

    // ✅ Handle deleted + media formatting
    const formattedMessages = messages.map((msg) => ({
      ...msg,
      content: msg.isDeleted ? "This message was deleted" : msg.content,
      mediaUrl: msg.isDeleted ? null : msg.mediaUrl,
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ----------------- DELETE MESSAGE -----------------
export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    const id = Number(messageId);

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({
        message: "Not authorized to delete this message",
      });
    }

    if (message.isDeleted) {
      return res.status(400).json({
        message: "Message already deleted",
      });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        isDeleted: true,
        content: "This message was deleted",
      },
    });

    // 🔥 emit delete event
    if (req.io) {
      req.io.to(`conversation_${message.conversationId}`).emit("messageDeleted", updatedMessage);
    }

    res.json({
      message: "Message deleted successfully",
      data: updatedMessage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------- EDIT MESSAGE -----------------
export const editMessage = async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  try {
    if (!content) {
      return res.status(400).json({
        message: "Content is required",
      });
    }

    const id = Number(messageId);

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({
        message: "Not authorized to edit this message",
      });
    }

    if (message.isDeleted) {
      return res.status(400).json({
        message: "Cannot edit a deleted message",
      });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        content,
      },
    });

    // 🔥 emit edit event
    if (req.io) {
      req.io.to(`conversation_${message.conversationId}`).emit("messageEdited", updatedMessage);
    }

    res.json({
      message: "Message edited successfully",
      data: updatedMessage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------- MARK AS DELIVERED -----------------
export const markAsDelivered = async (req, res) => {
  const { conversationId } = req.body;
  const userId = req.user.id;

  try {
    if (!conversationId) {
      return res.status(400).json({
        message: "conversationId is required",
      });
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: Number(conversationId),
        userId,
      },
    });

    if (!participant) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: Number(conversationId),
        senderId: { not: userId },
      },
      select: { id: true },
    });

    const updates = messages.map((msg) =>
      prisma.messageStatus.upsert({
        where: {
          messageId_userId: {
            messageId: msg.id,
            userId,
          },
        },
        update: {
          status: "delivered",
        },
        create: {
          messageId: msg.id,
          userId,
          status: "delivered",
        },
      })
    );

    await Promise.all(updates);

    // 🔥 emit delivered event
    if (req.io) {
      req.io.to(`conversation_${conversationId}`).emit("messagesDelivered", {
        userId,
      });
    }

    res.json({ message: "Messages marked as delivered" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};