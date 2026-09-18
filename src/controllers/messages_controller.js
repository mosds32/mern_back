import { prisma } from "../client/client.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

// ── GET /messages/get-conversations — Sab conversations (inbox list) ────────
export const getConversations = asyncHandler(async (req, res) => {
  const user_user_id = req.user?.user_id;

  if (!user_user_id) {
    throw new ApiError(401, "Unauthorized — user not found in request");
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      user_user_id: Number(user_user_id),
      conversation_deletedat: null,
    },
    include: {
      doctors: {
        select: {
          doctors_id: true,
          doctors_full_name: true,
          doctors_intials: true,
          speciality: { select: { speciality_type: true } },
        },
      },
      message: {
        where: { message_deletedat: null },
        orderBy: { message_createdat: "desc" },
        take: 1, // ── sirf last message inbox preview ke liye ──
      },
    },
    orderBy: { conversation_modifiedat: "desc" },
  });

  // ── Har conversation ke liye unread count nikaalo ──────────────────
  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await prisma.message.count({
        where: {
          conversation_conversation_id: conv.conversation_id,
          message_sender_type: { not: "user" },
          message_is_read: 0,
          message_deletedat: null,
        },
      });

      return {
        ...conv,
        lastMessage: conv.message[0] || null,
        unreadCount,
        message: undefined, // duplicate data hata do, lastMessage already hai
      };
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, conversationsWithUnread, "Conversations fetched successfully"));
});

// ── GET /messages/get-messages/:conversationId — Ek conversation ke saare messages ──
export const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const user_user_id = req.user?.user_id;

  if (!user_user_id) {
    throw new ApiError(401, "Unauthorized — user not found in request");
  }

  // ── Confirm karo ye conversation isi user ki hai ──────────────────
  const conversation = await prisma.conversation.findFirst({
    where: {
      conversation_id: Number(conversationId),
      user_user_id: Number(user_user_id),
      conversation_deletedat: null,
    },
    include: {
      doctors: {
        select: {
          doctors_full_name: true,
          doctors_intials: true,
          speciality: { select: { speciality_type: true } },
        },
      },
    },
  });

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  const messages = await prisma.message.findMany({
    where: {
      conversation_conversation_id: Number(conversationId),
      message_deletedat: null,
    },
    orderBy: { message_createdat: "asc" },
  });

  // ── Doctor/frontdesk ke unread messages ko read mark kar do ────────
  await prisma.message.updateMany({
    where: {
      conversation_conversation_id: Number(conversationId),
      message_sender_type: { not: "user" },
      message_is_read: 0,
    },
    data: { message_is_read: 1 },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { conversation, messages },
      "Messages fetched successfully"
    )
  );
});

// ── POST /messages/send-message — Naya message bhejo ─────────────────
export const sendMessage = asyncHandler(async (req, res) => {
  const { doctors_doctors_id, conversation_id, message_text } = req.body;
  const user_user_id = req.user?.user_id;

  if (!user_user_id) {
    throw new ApiError(401, "Unauthorized — user not found in request");
  }

  if (!message_text || !message_text.trim()) {
    throw new ApiError(400, "message_text is required");
  }

  if (!conversation_id && !doctors_doctors_id) {
    throw new ApiError(400, "Either conversation_id or doctors_doctors_id is required");
  }

  let conversation;

  if (conversation_id) {
    // ── Existing conversation mein message add karo ──────────────────
    conversation = await prisma.conversation.findFirst({
      where: {
        conversation_id: Number(conversation_id),
        user_user_id: Number(user_user_id),
        conversation_deletedat: null,
      },
    });

    if (!conversation) {
      throw new ApiError(404, "Conversation not found");
    }
  } else {
    // ── Doctor exist karta hai check karo ────────────────────────────
    const doctor = await prisma.doctors.findFirst({
      where: { doctors_id: Number(doctors_doctors_id), doctors_isactive: 1 },
    });

    if (!doctor) {
      throw new ApiError(404, "Doctor not found or inactive");
    }

    // ── Conversation already exist karti hai to wahi use karo, warna banao ──
    conversation = await prisma.conversation.findFirst({
      where: {
        user_user_id: Number(user_user_id),
        doctors_doctors_id: Number(doctors_doctors_id),
        conversation_deletedat: null,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user_user_id: Number(user_user_id),
          doctors_doctors_id: Number(doctors_doctors_id),
          conversation_type: "doctor",
          conversation_createdat: new Date(),
        },
      });
    }
  }

  const message = await prisma.message.create({
    data: {
      message_text: message_text.trim(),
      message_sender_type: "user",
      message_is_read: 0,
      message_createdat: new Date(),
      conversation_conversation_id: conversation.conversation_id,
    },
  });

  // ── Conversation ka modifiedat update karo (inbox sorting ke liye) ──
  await prisma.conversation.update({
    where: { conversation_id: conversation.conversation_id },
    data: { conversation_modifiedat: new Date() },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { conversation, message }, "Message sent successfully"));
});