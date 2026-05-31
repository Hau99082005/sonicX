import { RequestHandler } from "express";
import Conversation from "#/models/Conversation";
import Friendship from "#/models/Friendship";
import { isValidObjectId } from "mongoose";
import formidable from "formidable";
import cloudinary from "#/cloud";

export const createConversation: RequestHandler = async (req, res) => {
  let { type, name, members } = req.body;
  const avatar = req.files?.avatar as formidable.File;
  const userId = req.user.id;

  if (typeof members === "string") {
    try {
      members = JSON.parse(members);
    } catch (e) {
      members = [members];
    }
  }

  const memberIds = [
    ...new Set([...(Array.isArray(members) ? members : []), userId]),
  ];

  if (type === "private" && memberIds.length !== 2) {
    return res
      .status(422)
      .json({ error: "Private conversation must have 2 members!" });
  }

  if (type === "private") {
    const existing = await Conversation.findOne({
      type: "private",
      "members.user": { $all: memberIds },
      members: { $size: 2 },
    }).populate(
      "members.user",
      "username name avatar is_online last_seen show_online_status",
    );
    if (existing) return res.status(200).json({ conversation: existing });
  }

  let avatarData;
  if (avatar) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      avatar.filepath,
      { width: 400, height: 400, crop: "thumb" },
    );
    avatarData = { url: secure_url, publicId: public_id };
  }

  const conversation = await Conversation.create({
    type,
    name,
    avatar: avatarData,
    owner: type === "group" ? userId : undefined,
    members: memberIds.map((id) => ({
      user: id,
      role: id === userId && type === "group" ? "admin" : "member",
    })),
  });

  const populatedConversation = await conversation.populate(
    "members.user",
    "username name avatar is_online last_seen show_online_status",
  );
  if (populatedConversation.type === "private") {
    const other = populatedConversation.members.find(
      (m: any) => m.user._id.toString() !== userId.toString(),
    )?.user;
    if (other) {
      const friendship = await Friendship.findOne({
        $or: [
          { requester: userId, receiver: other._id },
          { requester: other._id, receiver: userId },
        ],
      });
      populatedConversation.members.forEach((m: any) => {
        if (m.user._id.toString() !== userId.toString())
          m.user.nickname = friendship?.nickname || null;
      });
    }
  }

  res.status(201).json({ conversation: populatedConversation });
};

export const getConversations: RequestHandler = async (req, res) => {
  const userId = req.user.id;

  const conversations = await Conversation.find({
    "members.user": userId,
  })
    .populate(
      "members.user",
      "username name avatar is_online last_seen show_online_status",
    )
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  for (const conv of conversations) {
    if (conv.type === "private") {
      const other = conv.members.find(
        (m: any) => m.user._id.toString() !== userId.toString(),
      )?.user;
      if (other) {
        const friendship = await Friendship.findOne({
          $or: [
            { requester: userId, receiver: other._id },
            { requester: other._id, receiver: userId },
          ],
        });
        conv.members.forEach((m: any) => {
          if (m.user._id.toString() !== userId.toString())
            m.user.nickname = friendship?.nickname || null;
        });
      }
    }
  }

  res.status(200).json({ conversations });
};

export const getConversationById: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!isValidObjectId(id))
    return res.status(422).json({ error: "Invalid conversation ID!" });

  const conversation = await Conversation.findOne({
    _id: id,
    "members.user": userId,
  }).populate(
    "members.user",
    "username name avatar is_online last_seen show_online_status",
  );

  if (!conversation)
    return res.status(404).json({ error: "Conversation not found!" });

  if (conversation.type === "private") {
    const other = conversation.members.find(
      (m: any) => m.user._id.toString() !== userId.toString(),
    )?.user;
    if (other) {
      const friendship = await Friendship.findOne({
        $or: [
          { requester: userId, receiver: other._id },
          { requester: other._id, receiver: userId },
        ],
      });
      conversation.members.forEach((m: any) => {
        if (m.user._id.toString() !== userId.toString())
          m.user.nickname = friendship?.nickname || null;
      });
    }
  }

  res.status(200).json({ conversation });
};

export const updateConversation: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const avatar = req.files?.avatar as formidable.File;
  const userId = req.user.id;

  if (!isValidObjectId(id))
    return res.status(422).json({ error: "Invalid conversation ID!" });

  const conversation = await Conversation.findOne({
    _id: id,
    "members.user": userId,
    "members.role": "admin",
  });

  if (!conversation)
    return res
      .status(404)
      .json({ error: "Conversation not found or unauthorized!" });

  if (name) conversation.name = name;

  if (avatar) {
    if (conversation.avatar?.publicId) {
      await cloudinary.uploader.destroy(conversation.avatar.publicId);
    }
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      avatar.filepath,
      { width: 400, height: 400, crop: "thumb" },
    );
    conversation.avatar = { url: secure_url, publicId: public_id };
  }

  await conversation.save();
  res.status(200).json({ conversation });
};

export const deleteConversation: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!isValidObjectId(id))
    return res.status(422).json({ error: "Invalid conversation ID!" });

  const conversation = await Conversation.findOne({
    _id: id,
    owner: userId,
  });

  if (!conversation)
    return res
      .status(404)
      .json({ error: "Conversation not found or unauthorized!" });

  if (conversation.avatar?.publicId) {
    await cloudinary.uploader.destroy(conversation.avatar.publicId);
  }

  await Conversation.findByIdAndDelete(id);

  res.status(200).json({ message: "Conversation deleted!" });
};

export const addMember: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const requester = req.user.id;

  if (!isValidObjectId(id) || !isValidObjectId(userId))
    return res.status(422).json({ error: "Invalid IDs" });

  const conv = await Conversation.findById(id);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  const isAdmin = conv.members.some(
    (m) => m.user.toString() === requester && m.role === "admin",
  );
  if (!isAdmin && conv.owner?.toString() !== requester)
    return res.status(403).json({ error: "Unauthorized" });

  if (conv.banned && conv.banned.some((b: any) => b.toString() === userId))
    return res.status(403).json({ error: "User is banned" });

  if (conv.members.some((m) => m.user.toString() === userId))
    return res.status(422).json({ error: "User already a member" });

  conv.members.push({ user: userId, role: "member" } as any);
  await conv.save();

  const io = req.app.get("io");
  io.to(id).emit("member-added", { conversationId: id, userId });

  res.status(200).json({ message: "Member added", conversation: conv });
};

export const removeMember: RequestHandler = async (req, res) => {
  const { id, userId } = req.params;
  const requester = req.user.id;

  if (!isValidObjectId(id) || !isValidObjectId(userId))
    return res.status(422).json({ error: "Invalid IDs" });

  const conv = await Conversation.findById(id);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  const isAdmin = conv.members.some(
    (m) => m.user.toString() === requester && m.role === "admin",
  );
  if (!isAdmin && conv.owner?.toString() !== requester)
    return res.status(403).json({ error: "Unauthorized" });

  if (!conv.members.some((m) => m.user.toString() === userId))
    return res.status(404).json({ error: "Member not found" });

  conv.members = conv.members.filter((m) => m.user.toString() !== userId);
  await conv.save();

  const io = req.app.get("io");
  io.to(id).emit("member-removed", { conversationId: id, userId });

  res.status(200).json({ message: "Member removed", conversation: conv });
};

export const promoteAdmin: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const requester = req.user.id;

  if (!isValidObjectId(id) || !isValidObjectId(userId))
    return res.status(422).json({ error: "Invalid IDs" });

  const conv = await Conversation.findById(id);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  const isAdmin = conv.members.some(
    (m) => m.user.toString() === requester && m.role === "admin",
  );
  if (!isAdmin && conv.owner?.toString() !== requester)
    return res.status(403).json({ error: "Unauthorized" });

  const member = conv.members.find((m) => m.user.toString() === userId);
  if (!member) return res.status(404).json({ error: "Member not found" });

  member.role = "admin";
  await conv.save();

  const io = req.app.get("io");
  io.to(id).emit("role-changed", { conversationId: id, userId, role: "admin" });

  res.status(200).json({ message: "Promoted to admin", conversation: conv });
};

export const demoteAdmin: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const requester = req.user.id;

  if (!isValidObjectId(id) || !isValidObjectId(userId))
    return res.status(422).json({ error: "Invalid IDs" });

  const conv = await Conversation.findById(id);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  const isAdmin = conv.members.some(
    (m) => m.user.toString() === requester && m.role === "admin",
  );
  if (!isAdmin && conv.owner?.toString() !== requester)
    return res.status(403).json({ error: "Unauthorized" });

  const member = conv.members.find((m) => m.user.toString() === userId);
  if (!member) return res.status(404).json({ error: "Member not found" });

  member.role = "member";
  await conv.save();

  const io = req.app.get("io");
  io.to(id).emit("role-changed", {
    conversationId: id,
    userId,
    role: "member",
  });

  res.status(200).json({ message: "Demoted from admin", conversation: conv });
};

export const banUser: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const requester = req.user.id;

  if (!isValidObjectId(id) || !isValidObjectId(userId))
    return res.status(422).json({ error: "Invalid IDs" });

  const conv = await Conversation.findById(id);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  const isAdmin = conv.members.some(
    (m) => m.user.toString() === requester && m.role === "admin",
  );
  if (!isAdmin && conv.owner?.toString() !== requester)
    return res.status(403).json({ error: "Unauthorized" });

  conv.members = conv.members.filter((m) => m.user.toString() !== userId);
  conv.banned = Array.from(
    new Set([...(conv.banned || ([] as any)), userId as any] as any),
  );
  await conv.save();

  const io = req.app.get("io");
  io.to(id).emit("user-banned", { conversationId: id, userId });

  res.status(200).json({ message: "User banned", conversation: conv });
};

export const unbanUser: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const requester = req.user.id;

  if (!isValidObjectId(id) || !isValidObjectId(userId))
    return res.status(422).json({ error: "Invalid IDs" });

  const conv = await Conversation.findById(id);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  const isAdmin = conv.members.some(
    (m) => m.user.toString() === requester && m.role === "admin",
  );
  if (!isAdmin && conv.owner?.toString() !== requester)
    return res.status(403).json({ error: "Unauthorized" });

  conv.banned = (conv.banned || []).filter((b: any) => b.toString() !== userId);
  await conv.save();

  const io = req.app.get("io");
  io.to(id).emit("user-unbanned", { conversationId: id, userId });

  res.status(200).json({ message: "User unbanned", conversation: conv });
};

export const toggleMute: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { userId, mute } = req.body;
  const requester = req.user.id;

  if (!isValidObjectId(id))
    return res.status(422).json({ error: "Invalid conversation ID" });

  const conv = await Conversation.findById(id);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  let target = requester;
  if (
    userId &&
    (conv.owner?.toString() === requester ||
      conv.members.some(
        (m) => m.user.toString() === requester && m.role === "admin",
      ))
  ) {
    target = userId;
  }

  const member = conv.members.find((m) => m.user.toString() === target);
  if (!member) return res.status(404).json({ error: "Member not found" });

  member.is_muted = Boolean(mute);
  await conv.save();

  const io = req.app.get("io");
  io.to(id).emit("mute-updated", {
    conversationId: id,
    userId: target,
    muted: member.is_muted,
  });

  res.status(200).json({ message: "Mute updated", conversation: conv });
};

export const leaveGroup: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!isValidObjectId(id))
    return res.status(422).json({ error: "Invalid conversation ID" });

  const conv = await Conversation.findById(id);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  conv.members = conv.members.filter((m) => m.user.toString() !== userId);

  if (conv.owner?.toString() === userId) {
    const newOwner =
      conv.members.find((m) => m.role === "admin") || conv.members[0];
    if (newOwner) conv.owner = newOwner.user as any;
    else {
      if (conv.avatar?.publicId)
        await cloudinary.uploader.destroy(conv.avatar.publicId);
      await Conversation.findByIdAndDelete(id);
      const io = req.app.get("io");
      io.to(id).emit("group-deleted", { conversationId: id });
      return res.status(200).json({ message: "Left and deleted group" });
    }
  }

  await conv.save();
  const io = req.app.get("io");
  io.to(id).emit("member-left", { conversationId: id, userId });

  res.status(200).json({ message: "Left group", conversation: conv });
};

export const kickUser: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const requester = req.user.id;

  if (!isValidObjectId(id) || !isValidObjectId(userId))
    return res.status(422).json({ error: "Invalid IDs" });

  const conv = await Conversation.findById(id);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  const isAdmin = conv.members.some(
    (m) => m.user.toString() === requester && m.role === "admin",
  );
  if (!isAdmin && conv.owner?.toString() !== requester)
    return res.status(403).json({ error: "Unauthorized" });

  conv.members = conv.members.filter((m) => m.user.toString() !== userId);
  await conv.save();

  const io = req.app.get("io");
  io.to(id).emit("user-kicked", { conversationId: id, userId });

  res.status(200).json({ message: "User kicked", conversation: conv });
};
