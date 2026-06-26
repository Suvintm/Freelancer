import prisma from "../../../config/prisma.js";
import logger from "../../../utils/logger.js";

/**
 * Get all conversations for the authenticated user
 */
export const getConversations = async (req, res) => {
  try {
    const myId = req.user.id;

    // Fetch all messages where user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { sender_id: myId },
          { receiver_id: myId }
        ]
      },
      orderBy: {
        created_at: 'desc'
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                name: true,
                profile_picture: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                name: true,
                profile_picture: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Aggregate into conversation list
    const conversationsMap = {};
    for (const msg of messages) {
      const otherUser = msg.sender_id === myId ? msg.receiver : msg.sender;
      if (!otherUser) continue;

      const otherUserId = otherUser.id;
      if (!conversationsMap[otherUserId]) {
        conversationsMap[otherUserId] = {
          id: otherUserId,
          user: {
            id: otherUserId,
            name: otherUser.profile?.name || otherUser.username || "User",
            username: otherUser.username,
            profilePicture: otherUser.profile?.profile_picture || null,
            primaryRole: otherUser.profile?.category?.name || "User"
          },
          lastMessage: {
            id: msg.id,
            content: msg.content,
            type: msg.type,
            isRead: msg.is_read,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            createdAt: msg.created_at
          },
          unreadCount: 0
        };
      }

      // Increment unread count for received messages
      if (!msg.is_read && msg.receiver_id === myId) {
        conversationsMap[otherUserId].unreadCount += 1;
      }
    }

    const conversations = Object.values(conversationsMap).sort(
      (a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    logger.error(`❌ [MESSAGE_CTRL] getConversations Error: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch conversations" });
  }
};

/**
 * Get message history between authenticated user and another user
 */
export const getMessageHistory = async (req, res) => {
  try {
    const myId = req.user.id;
    const { otherUserId } = req.params;

    if (!otherUserId) {
      return res.status(400).json({ success: false, message: "Other User ID is required" });
    }

    // Mark received messages from this user as read
    const updateResult = await prisma.message.updateMany({
      where: {
        sender_id: otherUserId,
        receiver_id: myId,
        is_read: false
      },
      data: {
        is_read: true
      }
    });

    if (updateResult.count > 0) {
      try {
        const { emitToUser } = await import("../../../src/infrastructure/websocket/socket.js");
        emitToUser(otherUserId, "messages:read", {
          readerId: myId
        });
      } catch (socketErr) {
        logger.warn(`⚠️ [MESSAGE_CTRL] Socket read broadcast failed: ${socketErr.message}`);
      }
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { sender_id: myId, receiver_id: otherUserId },
          { sender_id: otherUserId, receiver_id: myId }
        ]
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    logger.error(`❌ [MESSAGE_CTRL] getMessageHistory Error: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch message history" });
  }
};

/**
 * Send a message
 */
export const sendMessage = async (req, res) => {
  try {
    const myId = req.user.id;
    const { receiverId, content, type = "text" } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: "Receiver ID and content are required" });
    }

    const newMessage = await prisma.message.create({
      data: {
        sender_id: myId,
        receiver_id: receiverId,
        content,
        type
      }
    });

    // Real-time socket delivery if online
    try {
      const { emitToUser } = await import("../../../src/infrastructure/websocket/socket.js");
      emitToUser(receiverId, "message:new", {
        ...newMessage,
        status: "delivered"
      });
    } catch (socketErr) {
      logger.warn(`⚠️ [MESSAGE_CTRL] Socket broadcast failed: ${socketErr.message}`);
    }

    res.json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    logger.error(`❌ [MESSAGE_CTRL] sendMessage Error: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

/**
 * Get contacts list (all user profiles except the active user)
 */
export const getContacts = async (req, res) => {
  try {
    const myId = req.user.id;

    const profiles = await prisma.userProfile.findMany({
      where: {
        userId: {
          not: myId
        }
      },
      select: {
        userId: true,
        name: true,
        username: true,
        profile_picture: true,
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const contacts = profiles.map(p => ({
      id: p.userId,
      name: p.name || p.username || "User",
      username: p.username,
      profilePicture: p.profile_picture || null,
      primaryRole: p.category?.name || "User"
    }));

    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    logger.error(`❌ [MESSAGE_CTRL] getContacts Error: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch contacts" });
  }
};
