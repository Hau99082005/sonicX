"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = exports.deleteAllNotifications = exports.deleteNotification = exports.markOneRead = exports.markAllRead = exports.getNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const UserSettings_1 = __importDefault(require("../models/UserSettings"));
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { limit = 30, offset = 0 } = req.query;
    const notifications = yield Notification_1.default.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit))
        .populate("sender", "name username avatar");
    const unreadCount = yield Notification_1.default.countDocuments({
        user: userId,
        isRead: false,
    });
    res.status(200).json({ notifications, unreadCount });
});
exports.getNotifications = getNotifications;
const markAllRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    yield Notification_1.default.updateMany({ user: userId, isRead: false }, { isRead: true });
    res.status(200).json({ message: "Đã đánh dấu tất cả là đã đọc" });
});
exports.markAllRead = markAllRead;
const markOneRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const userId = req.user.id;
    yield Notification_1.default.findOneAndUpdate({ _id: id, user: userId }, { isRead: true });
    res.status(200).json({ message: "Đã đánh dấu đã đọc" });
});
exports.markOneRead = markOneRead;
const deleteNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const userId = req.user.id;
    yield Notification_1.default.findOneAndDelete({ _id: id, user: userId });
    res.status(200).json({ message: "Đã xóa thông báo" });
});
exports.deleteNotification = deleteNotification;
const deleteAllNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    yield Notification_1.default.deleteMany({ user: userId });
    res.status(200).json({ message: "Đã xóa tất cả thông báo" });
});
exports.deleteAllNotifications = deleteAllNotifications;
const getSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    let settings = yield UserSettings_1.default.findOne({ user: userId });
    if (!settings) {
        settings = yield UserSettings_1.default.create({ user: userId });
    }
    res.status(200).json({ settings });
});
exports.getSettings = getSettings;
const updateSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { notifications } = req.body;
    const settings = yield UserSettings_1.default.findOneAndUpdate({ user: userId }, { $set: { notifications } }, { upsert: true, returnDocument: "after" });
    res.status(200).json({ settings });
});
exports.updateSettings = updateSettings;
