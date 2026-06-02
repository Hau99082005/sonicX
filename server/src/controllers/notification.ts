import { RequestHandler } from "express";
import Notification from "#/models/Notification";
import UserSettings from "#/models/UserSettings";

export const getNotifications: RequestHandler = async (req, res) => {
  const userId = req.user.id;
  const { limit = 30, offset = 0 } = req.query;

  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(Number(offset))
    .limit(Number(limit))
    .populate("sender", "name username avatar");

  const unreadCount = await Notification.countDocuments({
    user: userId,
    isRead: false,
  });

  res.status(200).json({ notifications, unreadCount });
};

export const markAllRead: RequestHandler = async (req, res) => {
  const userId = req.user.id;
  await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  res.status(200).json({ message: "Đã đánh dấu tất cả là đã đọc" });
};

export const markOneRead: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await Notification.findOneAndUpdate(
    { _id: id, user: userId },
    { isRead: true },
  );

  res.status(200).json({ message: "Đã đánh dấu đã đọc" });
};

export const deleteNotification: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  await Notification.findOneAndDelete({ _id: id, user: userId });
  res.status(200).json({ message: "Đã xóa thông báo" });
};

export const deleteAllNotifications: RequestHandler = async (req, res) => {
  const userId = req.user.id;
  await Notification.deleteMany({ user: userId });
  res.status(200).json({ message: "Đã xóa tất cả thông báo" });
};

export const getSettings: RequestHandler = async (req, res) => {
  const userId = req.user.id;

  let settings = await UserSettings.findOne({ user: userId });
  if (!settings) {
    settings = await UserSettings.create({ user: userId });
  }

  res.status(200).json({ settings });
};

export const updateSettings: RequestHandler = async (req, res) => {
  const userId = req.user.id;
  const { notifications } = req.body;

  const settings = await UserSettings.findOneAndUpdate(
    { user: userId },
    { $set: { notifications } },
    { upsert: true, returnDocument: "after" },
  );

  res.status(200).json({ settings });
};
