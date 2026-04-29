
import prisma from "../config/db.js";


// ======================================================
// 🔥 1. CREATE OR GET 1-TO-1 CONVERSATION
// ======================================================
export const createConversation = async (req, res) => {
  const { userId } = req.body;
  const senderId = req.user.id;

  try {
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // 🔑 consistent unique key (prevents duplicate chats)
    const uniqueKey =
      senderId < userId
        ? `${senderId}_${userId}`
        : `${userId}_${senderId}`;

    // 🔍 check existing conversation
    let conversation = await prisma.conversation.findUnique({
      where: { uniqueKey },
      include: {
        participants: {
          include: { user: true },
        },
      },
    });

    if (conversation) {
      return res.json(conversation);
    }

    // 🆕 create new conversation
    conversation = await prisma.conversation.create({
      data: {
        uniqueKey,
        isGroup: false,

        participants: {
          create: [
            {
              userId: senderId,
              role: "member",
            },
            {
              userId,
              role: "member",
            },
          ],
        },
      },
      include: {
        participants: {
          include: { user: true },
        },
      },
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ======================================================
// 🔥 2. GET USER CONVERSATIONS
// ======================================================
export const getUserConversations = async (req, res) => {
  const userId = req.user.id;

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // last message preview
        },
      },
    });

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ======================================================
// 🔥 3. CREATE GROUP CONVERSATION (CLEAN + SAFE)
// ======================================================
export const createGroupConversation = async (req, res) => {
  const { name, members } = req.body;
  const creatorId = req.user.id;

  try {
    // 🔐 validation
    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        message: "Members must be a non-empty array",
      });
    }

    // 🔥 ensure creator is included + remove duplicates
    const uniqueMembers = [...new Set([creatorId, ...members])];

    // 🆕 create group conversation
    const conversation = await prisma.conversation.create({
      data: {
        name,
        isGroup: true,

        participants: {
          create: uniqueMembers.map((userId) => ({
            userId,
            role: userId === creatorId ? "admin" : "member",
          })),
        },
      },
      include: {
        participants: {
          include: { user: true },
        },
      },
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ======================================================
// 🔥 4. GET SINGLE CONVERSATION (WITH MESSAGES)
// ======================================================
export const getConversation = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const conversationId = Number(id);

    // 🔐 check if user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!participant) {
      return res.status(403).json({
        message: "Access denied to this conversation",
      });
    }

    // 📥 fetch full conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
        messages: {
          where: {
            isDeleted: false, // 🔥 respect soft delete
          },
          orderBy: {
            createdAt: "asc", // chat order
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
            status: true, // 🔥 message status (read/delivered)
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================================================
// 🔥 6. REMOVE MEMBER FROM GROUP
// ======================================================
export const removeMember = async (req, res) => {
  const { conversationId, userId } = req.body;
  const requesterId = req.user.id;

  try {
    if (!conversationId || !userId) {
      return res.status(400).json({
        message: "conversationId and userId are required",
      });
    }

    // 🔐 check requester role (must be admin)
    const requester = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: Number(conversationId),
        userId: requesterId,
      },
    });

    if (!requester || requester.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can remove members",
      });
    }

    // ❌ prevent removing yourself (optional rule)
    if (requesterId === userId) {
      return res.status(400).json({
        message: "Admins cannot remove themselves",
      });
    }

    // 🗑 remove member
    await prisma.conversationParticipant.deleteMany({
      where: {
        conversationId: Number(conversationId),
        userId,
      },
    });

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ======================================================
// 🔥 5. MARK MESSAGES AS READ
// ======================================================
export const markAsRead = async (req, res) => {
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

    // 📩 get unread messages NOT sent by this user
    const messages = await prisma.message.findMany({
      where: {
        conversationId: Number(conversationId),
        senderId: { not: userId },
      },
      select: { id: true },
    });

    // 🔥 update or create read status
    const updates = messages.map((msg) =>
      prisma.messageStatus.upsert({
        where: {
          messageId_userId: {
            messageId: msg.id,
            userId,
          },
        },
        update: {
          status: "read",
        },
        create: {
          messageId: msg.id,
          userId,
          status: "read",
        },
      })
    );

    await Promise.all(updates);

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};