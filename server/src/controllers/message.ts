import { RequestHandler } from "express";
import Message from "#/models/Message";
import Friendship from "#/models/Friendship";
import Conversation from "#/models/Conversation";
import Notification from "#/models/Notification";
import UserSettings from "#/models/UserSettings";
import { isValidObjectId } from "mongoose";
import formidable from "formidable";
import cloudinary from "#/cloud";

export const sendMessage: RequestHandler = async (req, res) => {
  const { conversationId, message, type, replyTo, meta } = req.body;
  const files = req.files?.media;
  const senderId = req.user.id;

  if (!isValidObjectId(conversationId))
    return res.status(422).json({ error: "Invalid conversation ID!" });

  const conversation = await Conversation.findOne({
    _id: conversationId,
    "members.user": senderId,
  });

  if (!conversation)
    return res
      .status(404)
      .json({ error: "Conversation not found or not a member!" });

  if (conversation.type === "private") {
    const other = conversation.members.find(
      (m: any) => m.user.toString() !== senderId.toString(),
    )?.user;
    if (other) {
      const blocked = await Friendship.findOne({
        $or: [
          { requester: senderId, receiver: other, status: "blocked" },
          { requester: other, receiver: senderId, status: "blocked" },
        ],
      });
      if (blocked) {
        return res.status(403).json({ error: "Không thể gửi tin nhắn do bị chặn!" });
      }
    }
  }

  const mediaData: any[] = [];
  if (files) {
    const fileList = Array.isArray(files) ? files : [files];
    for (const file of fileList) {
      // Xác định resource_type dựa trên mimetype
      const isAudio = file.mimetype?.includes("audio") || file.originalFilename?.endsWith(".mp3") || file.originalFilename?.endsWith(".mp4");
      const resourceType = isAudio ? "video" : "auto";

      const { secure_url, public_id, mimetype, size } =
        await cloudinary.uploader.upload(file.filepath, {
          resource_type: resourceType,
        });
      mediaData.push({
        url: secure_url,
        public_id: public_id,
        mime_type: mimetype,
        file_size: size,
      });
    }
  }

  const lastMessageTime = await Message.findOne({ sender: senderId }).sort({
    createdAt: -1,
  });
  if (
    lastMessageTime &&
    new Date().getTime() - lastMessageTime.createdAt.getTime() < 500
  ) {
    return res
      .status(429)
      .json({ error: "Thao tác quá nhanh, vui lòng chậm lại!" });
  }

  const newMessage = await Message.create({
    conversation: conversationId,
    sender: senderId,
    message,
    type: type || (mediaData.length > 0 ? "image" : "text"),
    media: mediaData,
    replyTo: isValidObjectId(replyTo) ? replyTo : undefined,
    meta: typeof meta === "string" ? JSON.parse(meta) : meta,
  });

  const populatedMessage = await newMessage.populate(
    "sender",
    "username avatar",
  );

  conversation.lastMessage = newMessage._id as any;
  await conversation.save();

  if (conversation.type === "private") {
    const other = conversation.members.find(
      (m: any) => m.user.toString() !== senderId.toString(),
    )?.user;
    if (other) {
      const friendship = await Friendship.findOne({
        $or: [
          { requester: senderId, receiver: other },
          { requester: other, receiver: senderId },
        ],
      });
      (populatedMessage.sender as any).nickname = friendship?.nickname || null;
    }
  }

  const io = req.app.get("io");
  io.to(conversationId).emit("new-message", { message: populatedMessage });

  const recipients = conversation.members.filter(
    (m: any) => m.user.toString() !== senderId.toString() && !m.is_muted,
  );

  for (const member of recipients) {
    const recipientId = member.user.toString();

    const recipientSettings = await UserSettings.findOne({ user: recipientId });
    const notificationsEnabled =
      !recipientSettings || recipientSettings.notifications.enabled;
    const messagesEnabled =
      !recipientSettings || recipientSettings.notifications.messages;

    if (!notificationsEnabled || !messagesEnabled) continue;

    const senderName =
      (populatedMessage.sender as any)?.name ||
      (populatedMessage.sender as any)?.username ||
      "Ai đó";

    const preview =
      recipientSettings?.notifications.preview !== false
        ? (newMessage.message?.slice(0, 60) ?? "Đã gửi một tệp")
        : "Tin nhắn mới";

    const notif = await Notification.create({
      user: recipientId,
      sender: senderId,
      type: "message",
      content: `${senderName}: ${preview}`,
      conversationId,
    });

    const populated = await notif.populate("sender", "name username avatar");

    io.to(recipientId).emit("notification", {
      notification: populated,
      sound: recipientSettings?.notifications.sound !== false,
      vibration: recipientSettings?.notifications.vibration !== false,
    });
  }

  res.status(201).json({ message: populatedMessage });
};

export const getMessages: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;
  const { limit = 20, offset = 0 } = req.query;
  const userId = req.user.id;

  if (!isValidObjectId(conversationId))
    return res.status(422).json({ error: "Invalid conversation ID!" });

  const conversation = await Conversation.findById(conversationId);

  const messages = await Message.find({
    conversation: conversationId,
  })
    .sort({ createdAt: -1 })
    .skip(Number(offset))
    .limit(Number(limit))
    .populate("sender", "username avatar name")
    .populate("replyTo");

  if (conversation && conversation.type === "private") {
    const other = conversation.members.find(
      (m: any) => m.user.toString() !== userId.toString(),
    )?.user;
    if (other) {
      const friendship = await Friendship.findOne({
        $or: [
          { requester: userId, receiver: other },
          { requester: other, receiver: userId },
        ],
      });
      messages.forEach((msg: any) => {
        if (msg.sender && msg.sender._id.toString() === other.toString())
          msg.sender.nickname = friendship?.nickname || null;
      });
    }
  }

  res.status(200).json({ messages });
};

export const markAsSeen: RequestHandler = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  if (!isValidObjectId(messageId))
    return res.status(422).json({ error: "Invalid message ID!" });

  const message = await Message.findById(messageId);
  if (!message) return res.status(404).json({ error: "Message not found!" });

  const alreadySeen = message.seenBy.find((s) => s.user.toString() === userId);
  if (!alreadySeen) {
    message.seenBy.push({ user: userId as any, seen_at: new Date() });
    await message.save();
  }

  res.status(200).json({ message: "Marked as seen" });
};

export const addReaction: RequestHandler = async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user.id;

  if (!isValidObjectId(messageId))
    return res.status(422).json({ error: "Invalid message ID!" });

  const message = await Message.findById(messageId);
  if (!message) return res.status(404).json({ error: "Message not found!" });

  const reactionIndex = message.reactions.findIndex(
    (r) => r.user.toString() === userId,
  );
  if (reactionIndex > -1) {
    if (message.reactions[reactionIndex].emoji === emoji) {
      message.reactions.splice(reactionIndex, 1);
    } else {
      message.reactions[reactionIndex].emoji = emoji;
    }
  } else {
    message.reactions.push({
      user: userId as any,
      emoji,
      createdAt: new Date(),
    });
  }

  await message.save();

  const io = req.app.get("io");
  if (io) {
    io.to(message.conversation.toString()).emit("reaction-updated", {
      messageId,
      reactions: message.reactions,
    });
  }

  res.status(200).json({ message: "Reaction updated", reactions: message.reactions });
};

export const updateMessage: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user.id;

  if (!isValidObjectId(id))
    return res.status(422).json({ error: "Invalid message ID!" });

  const updatedMessage = await Message.findOneAndUpdate(
    { _id: id, sender: userId },
    { message, isEdited: true },
    { returnDocument: "after" },
  );

  if (!updatedMessage)
    return res
      .status(404)
      .json({ error: "Message not found or unauthorized!" });

  const io = req.app.get("io");
  if (io) {
    io.to(updatedMessage.conversation.toString()).emit("message-updated", {
      messageId: id,
      message: updatedMessage.message,
      isEdited: true,
    });
  }

  res.status(200).json({ message: updatedMessage });
};

export const deleteMessage: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!isValidObjectId(id))
    return res.status(422).json({ error: "Invalid message ID!" });

  const message = await Message.findOne({ _id: id, sender: userId });

  if (!message)
    return res
      .status(404)
      .json({ error: "Message not found or unauthorized!" });

  const conversationId = message.conversation.toString();

  if (message.media && message.media.length > 0) {
    for (const item of message.media) {
      if (item.public_id) {
        const resourceType = message.type === "audio" ? "video" : "auto";
        await cloudinary.uploader.destroy(item.public_id, {
          resource_type: resourceType,
        });
      }
    }
  }

  message.isDeleted = true;
  message.message = "Tin nhắn đã bị thu hồi";
  message.media = [];
  await message.save();

  const io = req.app.get("io");
  if (io) {
    io.to(conversationId).emit("message-deleted", { messageId: id });
  }

  res.status(200).json({ message: "Message deleted!" });
};
