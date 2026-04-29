
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

    const uniqueKey =
      senderId < userId
        ? `${senderId}_${userId}`
        : `${userId}_${senderId}`;

    let conversation = await prisma.conversation.findUnique({
      where: { uniqueKey },
      include: {
        participants: { include: { user: true } },
      },
    });

    if (conversation) return res.json(conversation);

    conversation = await prisma.conversation.create({
      data: {
        uniqueKey,
        isGroup: false,
        participants: {
          create: [
            { userId: senderId, role: "member" },
            { userId, role: "member" },
          ],
        },
      },
      include: {
        participants: { include: { user: true } },
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
        participants: { some: { userId } },
      },
      include: {
        participants: { include: { user: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
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
// 🔥 3. CREATE GROUP CONVERSATION
// ======================================================
export const createGroupConversation = async (req, res) => {
  const { name, members } = req.body;
  const creatorId = req.user.id;

  try {
    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        message: "Members must be a non-empty array",
      });
    }

    const uniqueMembers = [...new Set([creatorId, ...members])];

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
        participants: { include: { user: true } },
      },
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ======================================================
// 🔥 4. GET SINGLE CONVERSATION
// ======================================================
export const getConversation = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const conversationId = Number(id);

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (!participant) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

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
          where: { isDeleted: false },
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true } },
            status: true,
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
// 🔥 5. ADD MEMBER (ADMIN ONLY)
// ======================================================
export const addMember = async (req, res) => {
  const { conversationId, userId } = req.body;
  const requesterId = req.user.id;

  try {
    const requester = await prisma.conversationParticipant.findFirst({
      where: { conversationId: Number(conversationId), userId: requesterId },
    });

    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Only admins can add members" });
    }

    const existing = await prisma.conversationParticipant.findFirst({
      where: { conversationId: Number(conversationId), userId },
    });

    if (existing) {
      return res.status(400).json({ message: "User already in group" });
    }

    await prisma.conversationParticipant.create({
      data: {
        conversationId: Number(conversationId),
        userId,
        role: "member",
      },
    });

    res.json({ message: "Member added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ======================================================
// 🔥 6. REMOVE MEMBER (IMPROVED)
// ======================================================
export const removeMember = async (req, res) => {
  const { conversationId, userId } = req.body;
  const requesterId = req.user.id;

  try {
    const requester = await prisma.conversationParticipant.findFirst({
      where: { conversationId: Number(conversationId), userId: requesterId },
    });

    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Only admins can remove members" });
    }

    if (requesterId === userId) {
      return res.status(400).json({
        message: "Admins cannot remove themselves",
      });
    }

    // 🔥 prevent removing last admin
    const target = await prisma.conversationParticipant.findFirst({
      where: { conversationId: Number(conversationId), userId },
    });

    if (target?.role === "admin") {
      const adminCount = await prisma.conversationParticipant.count({
        where: { conversationId: Number(conversationId), role: "admin" },
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot remove the last admin",
        });
      }
    }

    await prisma.conversationParticipant.deleteMany({
      where: { conversationId: Number(conversationId), userId },
    });

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ======================================================
// 🔥 7. MAKE ADMIN
// ======================================================
export const makeAdmin = async (req, res) => {
  const { conversationId, userId } = req.body;
  const requesterId = req.user.id;

  try {
    const requester = await prisma.conversationParticipant.findFirst({
      where: { conversationId: Number(conversationId), userId: requesterId },
    });

    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Only admins can promote users" });
    }

    await prisma.conversationParticipant.updateMany({
      where: { conversationId: Number(conversationId), userId },
      data: { role: "admin" },
    });

    res.json({ message: "User promoted to admin" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ======================================================
// 🔥 8. UPDATE USER ROLE
// ======================================================
export const updateUserRole = async (req, res) => {
  const { conversationId, userId, role } = req.body;
  const requesterId = req.user.id;

  try {
    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const requester = await prisma.conversationParticipant.findFirst({
      where: { conversationId: Number(conversationId), userId: requesterId },
    });

    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Only admins can update roles" });
    }

    await prisma.conversationParticipant.updateMany({
      where: { conversationId: Number(conversationId), userId },
      data: { role },
    });

    res.json({ message: "User role updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ======================================================
// 🔥 9. MARK MESSAGES AS READ
// ======================================================
export const markAsRead = async (req, res) => {
  const { conversationId } = req.body;
  const userId = req.user.id;

  try {
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: Number(conversationId), userId },
    });

    if (!participant) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: Number(conversationId),
        senderId: { not: userId },
      },
      select: { id: true },
    });

    await Promise.all(
      messages.map((msg) =>
        prisma.messageStatus.upsert({
          where: {
            messageId_userId: {
              messageId: msg.id,
              userId,
            },
          },
          update: { status: "read" },
          create: {
            messageId: msg.id,
            userId,
            status: "read",
          },
        })
      )
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};