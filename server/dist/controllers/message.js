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
exports.deleteMessage = exports.updateMessage = exports.addReaction = exports.markAsSeen = exports.getMessages = exports.sendMessage = void 0;
const Message_1 = __importDefault(require("../models/Message"));
const Friendship_1 = __importDefault(require("../models/Friendship"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Notification_1 = __importDefault(require("../models/Notification"));
const UserSettings_1 = __importDefault(require("../models/UserSettings"));
const mongoose_1 = require("mongoose");
const cloud_1 = __importDefault(require("../cloud"));
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const { conversationId, message, type, replyTo, meta } = req.body;
    const files = (_a = req.files) === null || _a === void 0 ? void 0 : _a.media;
    const senderId = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(conversationId))
        return res.status(422).json({ error: "Invalid conversation ID!" });
    const conversation = yield Conversation_1.default.findOne({
        _id: conversationId,
        "members.user": senderId,
    });
    if (!conversation)
        return res
            .status(404)
            .json({ error: "Conversation not found or not a member!" });
    if (conversation.type === "private") {
        const other = (_b = conversation.members.find((m) => m.user.toString() !== senderId.toString())) === null || _b === void 0 ? void 0 : _b.user;
        if (other) {
            const blocked = yield Friendship_1.default.findOne({
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
    const mediaData = [];
    if (files) {
        const fileList = Array.isArray(files) ? files : [files];
        for (const file of fileList) {
            const isAudio = ((_c = file.mimetype) === null || _c === void 0 ? void 0 : _c.includes("audio")) || ((_d = file.originalFilename) === null || _d === void 0 ? void 0 : _d.endsWith(".mp3")) || ((_e = file.originalFilename) === null || _e === void 0 ? void 0 : _e.endsWith(".mp4"));
            const resourceType = isAudio ? "video" : "auto";
            const { secure_url, public_id, mimetype, size } = yield cloud_1.default.uploader.upload(file.filepath, {
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
    const lastMessageTime = yield Message_1.default.findOne({ sender: senderId }).sort({
        createdAt: -1,
    });
    if (lastMessageTime &&
        new Date().getTime() - lastMessageTime.createdAt.getTime() < 500) {
        return res
            .status(429)
            .json({ error: "Thao tác quá nhanh, vui lòng chậm lại!" });
    }
    const newMessage = yield Message_1.default.create({
        conversation: conversationId,
        sender: senderId,
        message,
        type: type || (mediaData.length > 0 ? "image" : "text"),
        media: mediaData,
        replyTo: (0, mongoose_1.isValidObjectId)(replyTo) ? replyTo : undefined,
        meta: typeof meta === "string" ? JSON.parse(meta) : meta,
    });
    const populatedMessage = yield newMessage.populate("sender", "username avatar");
    conversation.lastMessage = newMessage._id;
    yield conversation.save();
    if (conversation.type === "private") {
        const other = (_f = conversation.members.find((m) => m.user.toString() !== senderId.toString())) === null || _f === void 0 ? void 0 : _f.user;
        if (other) {
            const friendship = yield Friendship_1.default.findOne({
                $or: [
                    { requester: senderId, receiver: other },
                    { requester: other, receiver: senderId },
                ],
            });
            populatedMessage.sender.nickname = (friendship === null || friendship === void 0 ? void 0 : friendship.nickname) || null;
        }
    }
    const io = req.app.get("io");
    io.to(conversationId).emit("new-message", { message: populatedMessage });
    const recipients = conversation.members.filter((m) => m.user.toString() !== senderId.toString() && !m.is_muted);
    for (const member of recipients) {
        const recipientId = member.user.toString();
        const recipientSettings = yield UserSettings_1.default.findOne({ user: recipientId });
        const notificationsEnabled = !recipientSettings || recipientSettings.notifications.enabled;
        const messagesEnabled = !recipientSettings || recipientSettings.notifications.messages;
        if (!notificationsEnabled || !messagesEnabled)
            continue;
        const senderName = ((_g = populatedMessage.sender) === null || _g === void 0 ? void 0 : _g.name) ||
            ((_h = populatedMessage.sender) === null || _h === void 0 ? void 0 : _h.username) ||
            "Ai đó";
        const preview = (recipientSettings === null || recipientSettings === void 0 ? void 0 : recipientSettings.notifications.preview) !== false
            ? ((_k = (_j = newMessage.message) === null || _j === void 0 ? void 0 : _j.slice(0, 60)) !== null && _k !== void 0 ? _k : "Đã gửi một tệp")
            : "Tin nhắn mới";
        const notif = yield Notification_1.default.create({
            user: recipientId,
            sender: senderId,
            type: "message",
            content: `${senderName}: ${preview}`,
            conversationId,
        });
        const populated = yield notif.populate("sender", "name username avatar");
        io.to(recipientId).emit("notification", {
            notification: populated,
            sound: (recipientSettings === null || recipientSettings === void 0 ? void 0 : recipientSettings.notifications.sound) !== false,
            vibration: (recipientSettings === null || recipientSettings === void 0 ? void 0 : recipientSettings.notifications.vibration) !== false,
        });
    }
    res.status(201).json({ message: populatedMessage });
});
exports.sendMessage = sendMessage;
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { conversationId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(conversationId))
        return res.status(422).json({ error: "Invalid conversation ID!" });
    const conversation = yield Conversation_1.default.findById(conversationId);
    const messages = yield Message_1.default.find({
        conversation: conversationId,
    })
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit))
        .populate("sender", "username avatar name")
        .populate("replyTo");
    if (conversation && conversation.type === "private") {
        const other = (_a = conversation.members.find((m) => m.user.toString() !== userId.toString())) === null || _a === void 0 ? void 0 : _a.user;
        if (other) {
            const friendship = yield Friendship_1.default.findOne({
                $or: [
                    { requester: userId, receiver: other },
                    { requester: other, receiver: userId },
                ],
            });
            messages.forEach((msg) => {
                if (msg.sender && msg.sender._id.toString() === other.toString())
                    msg.sender.nickname = (friendship === null || friendship === void 0 ? void 0 : friendship.nickname) || null;
            });
        }
    }
    res.status(200).json({ messages });
});
exports.getMessages = getMessages;
const markAsSeen = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messageId } = req.params;
    const userId = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(messageId))
        return res.status(422).json({ error: "Invalid message ID!" });
    const message = yield Message_1.default.findById(messageId);
    if (!message)
        return res.status(404).json({ error: "Message not found!" });
    const alreadySeen = message.seenBy.find((s) => s.user.toString() === userId);
    if (!alreadySeen) {
        message.seenBy.push({ user: userId, seen_at: new Date() });
        yield message.save();
    }
    res.status(200).json({ message: "Marked as seen" });
});
exports.markAsSeen = markAsSeen;
const addReaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(messageId))
        return res.status(422).json({ error: "Invalid message ID!" });
    const message = yield Message_1.default.findById(messageId);
    if (!message)
        return res.status(404).json({ error: "Message not found!" });
    const reactionIndex = message.reactions.findIndex((r) => r.user.toString() === userId);
    if (reactionIndex > -1) {
        if (message.reactions[reactionIndex].emoji === emoji) {
            message.reactions.splice(reactionIndex, 1);
        }
        else {
            message.reactions[reactionIndex].emoji = emoji;
        }
    }
    else {
        message.reactions.push({
            user: userId,
            emoji,
            createdAt: new Date(),
        });
    }
    yield message.save();
    const io = req.app.get("io");
    if (io) {
        io.to(message.conversation.toString()).emit("reaction-updated", {
            messageId,
            reactions: message.reactions,
        });
    }
    res.status(200).json({ message: "Reaction updated", reactions: message.reactions });
});
exports.addReaction = addReaction;
const updateMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(id))
        return res.status(422).json({ error: "Invalid message ID!" });
    const updatedMessage = yield Message_1.default.findOneAndUpdate({ _id: id, sender: userId }, { message, isEdited: true }, { returnDocument: "after" });
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
});
exports.updateMessage = updateMessage;
const deleteMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const userId = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(id))
        return res.status(422).json({ error: "Invalid message ID!" });
    const message = yield Message_1.default.findOne({ _id: id, sender: userId });
    if (!message)
        return res
            .status(404)
            .json({ error: "Message not found or unauthorized!" });
    const conversationId = message.conversation.toString();
    if (message.media && message.media.length > 0) {
        for (const item of message.media) {
            if (item.public_id) {
                const resourceType = message.type === "audio" ? "video" : "auto";
                yield cloud_1.default.uploader.destroy(item.public_id, {
                    resource_type: resourceType,
                });
            }
        }
    }
    message.isDeleted = true;
    message.message = "Tin nhắn đã bị thu hồi";
    message.media = [];
    yield message.save();
    const io = req.app.get("io");
    if (io) {
        io.to(conversationId).emit("message-deleted", { messageId: id });
    }
    res.status(200).json({ message: "Message deleted!" });
});
exports.deleteMessage = deleteMessage;
