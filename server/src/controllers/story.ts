import { RequestHandler } from "express";
import Story from "#/models/Story";
import formidable from "formidable";
import cloudinary from "#/cloud";
import { isValidObjectId } from "mongoose";

export const createStory: RequestHandler = async (req, res) => {
  let { type } = req.body;
  const file = req.files?.content as formidable.File;
  const userId = req.user.id;

  const validTypes = ["image", "video", "text"];
  if (type && !validTypes.includes(type)) {
    type = file ? "image" : "text";
  }

  if (!type) {
    type = file ? "image" : "text";
  }

  if (type !== "text" && !file) {
    return res.status(422).json({ error: "File is required for image/video story!" });
  }

  let content = req.body.content;
  let publicId;

  if (type !== "text" && file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.filepath,
      { resource_type: "auto" }
    );
    content = secure_url;
    publicId = public_id;
  }

  const story = await Story.create({
    user: userId,
    type: type || "image",
    content,
    publicId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  res.status(201).json({ story });
};

export const getStories: RequestHandler = async (req, res) => {
  const userId = req.user.id;
  const stories = await Story.find({
    expiresAt: { $gt: new Date() },
  })
    .populate("user", "username avatar")
    .sort({ createdAt: -1 });

  res.status(200).json({ stories });
};

export const deleteStory: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!isValidObjectId(id))
    return res.status(422).json({ error: "Invalid story ID!" });

  const story = await Story.findOne({ _id: id, user: userId });
  if (!story) return res.status(404).json({ error: "Story not found!" });

  if (story.publicId) {
    await cloudinary.uploader.destroy(story.publicId);
  }

  await Story.findByIdAndDelete(id);
  res.status(200).json({ message: "Story deleted!" });
};
