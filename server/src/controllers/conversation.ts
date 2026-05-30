import { RequestHandler } from "express";
import Conversation from "#/models/Conversation";
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

  const memberIds = [...new Set([...(Array.isArray(members) ? members : []), userId])];

  if (type === "private" && memberIds.length !== 2) {
    return res.status(422).json({ error: "Private conversation must have 2 members!" });
  }

  if (type === "private") {
    const existing = await Conversation.findOne({
      type: "private",
      "members.user": { $all: memberIds },
      members: { $size: 2 },
    }).populate("members.user", "username name avatar is_online last_seen show_online_status");
    if (existing) return res.status(200).json({ conversation: existing });
  }

  let avatarData;
  if (avatar) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      avatar.filepath,
      { width: 400, height: 400, crop: "thumb" }
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

  const populatedConversation = await conversation.populate("members.user", "username name avatar is_online last_seen show_online_status");

  res.status(201).json({ conversation: populatedConversation });
};

export const getConversations: RequestHandler = async (req, res) => {
  const userId = req.user.id;

  const conversations = await Conversation.find({
    "members.user": userId,
  })
    .populate("members.user", "username name avatar is_online last_seen show_online_status")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

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
  }).populate("members.user", "username name avatar is_online last_seen show_online_status");

  if (!conversation)
    return res.status(404).json({ error: "Conversation not found!" });

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
    return res.status(404).json({ error: "Conversation not found or unauthorized!" });

  if (name) conversation.name = name;

  if (avatar) {
    if (conversation.avatar?.publicId) {
      await cloudinary.uploader.destroy(conversation.avatar.publicId);
    }
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      avatar.filepath,
      { width: 400, height: 400, crop: "thumb" }
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
    return res.status(404).json({ error: "Conversation not found or unauthorized!" });

  if (conversation.avatar?.publicId) {
    await cloudinary.uploader.destroy(conversation.avatar.publicId);
  }

  await Conversation.findByIdAndDelete(id);

  res.status(200).json({ message: "Conversation deleted!" });
};
