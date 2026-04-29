

import prisma from "../config/db.js";

// ----------------- SEND MESSAGE -----------------
export const sendMessage = async (req, res) => {
  const { conversationId, content } = req.body;
  const senderId = req.user.id;

  try {
    if (!conversationId || !content) {
      return res.status(400).json({
        message: "conversationId and content are required",
      });
    }

    // 🔍 check conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: Number(conversationId) },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // 🔐 check user is participant (IMPORTANT SECURITY FIX)
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

    // 📨 create message
    const message = await prisma.message.create({
      data: {
        content,
        conversationId: Number(conversationId),
        senderId,
      },
      include: {
        sender: true,
      },
    });

    // 📊 create message status for ALL participants
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

    // 🔥 SOCKET.IO (ROOM BASED — IMPORTANT FIX)
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
  const userId = req.user.id;

  try {
    // 🔐 verify access
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: Number(conversationId),
        userId,
      },
    });

    if (!isParticipant) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: Number(conversationId),
        isDeleted: false,
      },
      include: {
        sender: true,
        status: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ======================================================
// 🔥 DELETE MESSAGE (SOFT DELETE)
// ======================================================
export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    const id = Number(messageId);

    // 🔍 find message
    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    // 🔐 only sender can delete
    if (message.senderId !== userId) {
      return res.status(403).json({
        message: "Not authorized to delete this message",
      });
    }

    // ❗ already deleted
    if (message.isDeleted) {
      return res.status(400).json({
        message: "Message already deleted",
      });
    }

    // 🗑 soft delete
    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        isDeleted: true,
        content: "This message was deleted", // optional UX improvement
      },
    });

    res.json({
      message: "Message deleted successfully",
      data: updatedMessage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ======================================================
// 🔥 EDIT MESSAGE
// ======================================================
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

    // 🔍 find message
    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    // 🔐 only sender can edit
    if (message.senderId !== userId) {
      return res.status(403).json({
        message: "Not authorized to edit this message",
      });
    }

    // ❌ cannot edit deleted message
    if (message.isDeleted) {
      return res.status(400).json({
        message: "Cannot edit a deleted message",
      });
    }

    // ✏️ update message
    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        content,
        updatedAt: new Date(),
      },
    });

    res.json({
      message: "Message edited successfully",
      data: updatedMessage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ======================================================
// 🔥 MARK MESSAGES AS DELIVERED
// ======================================================
export const markAsDelivered = async (req, res) => {
  const { conversationId } = req.body;
  const userId = req.user.id;

  try {
    if (!conversationId) {
      return res.status(400).json({
        message: "conversationId is required",
      });
    }

    // 🔐 ensure user is part of conversation
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

    // 📩 get messages not sent by this user
    const messages = await prisma.message.findMany({
      where: {
        conversationId: Number(conversationId),
        senderId: { not: userId },
      },
      select: { id: true },
    });

    // 🔥 update status to delivered
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

    res.json({ message: "Messages marked as delivered" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};