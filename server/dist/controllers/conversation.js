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
exports.kickUser = exports.leaveGroup = exports.toggleMute = exports.unbanUser = exports.banUser = exports.demoteAdmin = exports.promoteAdmin = exports.removeMember = exports.addMember = exports.deleteConversation = exports.updateConversation = exports.getConversationById = exports.getConversations = exports.createConversation = void 0;
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Friendship_1 = __importDefault(require("../models/Friendship"));
const mongoose_1 = require("mongoose");
const cloud_1 = __importDefault(require("../cloud"));
const createConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let { type, name, members } = req.body;
    const avatar = (_a = req.files) === null || _a === void 0 ? void 0 : _a.avatar;
    const userId = req.user.id;
    if (typeof members === "string") {
        try {
            members = JSON.parse(members);
        }
        catch (e) {
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
        const existing = yield Conversation_1.default.findOne({
            type: "private",
            "members.user": { $all: memberIds },
            members: { $size: 2 },
        }).populate("members.user", "username name avatar is_online last_seen show_online_status");
        if (existing)
            return res.status(200).json({ conversation: existing });
    }
    let avatarData;
    if (avatar) {
        const { secure_url, public_id } = yield cloud_1.default.uploader.upload(avatar.filepath, { width: 400, height: 400, crop: "thumb" });
        avatarData = { url: secure_url, publicId: public_id };
    }
    const conversation = yield Conversation_1.default.create({
        type,
        name,
        avatar: avatarData,
        owner: type === "group" ? userId : undefined,
        members: memberIds.map((id) => ({
            user: id,
            role: id === userId && type === "group" ? "admin" : "member",
        })),
    });
    const populatedConversation = yield conversation.populate("members.user", "username name avatar is_online last_seen show_online_status");
    if (populatedConversation.type === "private") {
        const other = (_b = populatedConversation.members.find((m) => m.user._id.toString() !== userId.toString())) === null || _b === void 0 ? void 0 : _b.user;
        if (other) {
            const friendship = yield Friendship_1.default.findOne({
                $or: [
                    { requester: userId, receiver: other._id },
                    { requester: other._id, receiver: userId },
                ],
            });
            populatedConversation.members.forEach((m) => {
                if (m.user._id.toString() !== userId.toString())
                    m.user.nickname = (friendship === null || friendship === void 0 ? void 0 : friendship.nickname) || null;
            });
        }
    }
    res.status(201).json({ conversation: populatedConversation });
});
exports.createConversation = createConversation;
const getConversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = req.user.id;
    const conversations = yield Conversation_1.default.find({
        "members.user": userId,
    })
        .populate("members.user", "username name avatar is_online last_seen show_online_status")
        .populate("lastMessage")
        .sort({ updatedAt: -1 });
    for (const conv of conversations) {
        if (conv.type === "private") {
            const other = (_a = conv.members.find((m) => m.user._id.toString() !== userId.toString())) === null || _a === void 0 ? void 0 : _a.user;
            if (other) {
                const friendship = yield Friendship_1.default.findOne({
                    $or: [
                        { requester: userId, receiver: other._id },
                        { requester: other._id, receiver: userId },
                    ],
                });
                conv.members.forEach((m) => {
                    if (m.user._id.toString() !== userId.toString())
                        m.user.nickname = (friendship === null || friendship === void 0 ? void 0 : friendship.nickname) || null;
                });
            }
        }
    }
    res.status(200).json({ conversations });
});
exports.getConversations = getConversations;
const getConversationById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const userId = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(id))
        return res.status(422).json({ error: "Invalid conversation ID!" });
    const conversation = yield Conversation_1.default.findOne({
        _id: id,
        "members.user": userId,
    }).populate("members.user", "username name avatar is_online last_seen show_online_status");
    if (!conversation)
        return res.status(404).json({ error: "Conversation not found!" });
    if (conversation.type === "private") {
        const other = (_a = conversation.members.find((m) => m.user._id.toString() !== userId.toString())) === null || _a === void 0 ? void 0 : _a.user;
        if (other) {
            const friendship = yield Friendship_1.default.findOne({
                $or: [
                    { requester: userId, receiver: other._id },
                    { requester: other._id, receiver: userId },
                ],
            });
            conversation.members.forEach((m) => {
                if (m.user._id.toString() !== userId.toString())
                    m.user.nickname = (friendship === null || friendship === void 0 ? void 0 : friendship.nickname) || null;
            });
        }
    }
    res.status(200).json({ conversation });
});
exports.getConversationById = getConversationById;
const updateConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const { name } = req.body;
    const avatar = (_a = req.files) === null || _a === void 0 ? void 0 : _a.avatar;
    const userId = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(id))
        return res.status(422).json({ error: "Invalid conversation ID!" });
    const conversation = yield Conversation_1.default.findOne({
        _id: id,
        "members.user": userId,
        "members.role": "admin",
    });
    if (!conversation)
        return res
            .status(404)
            .json({ error: "Conversation not found or unauthorized!" });
    if (name)
        conversation.name = name;
    if (avatar) {
        if ((_b = conversation.avatar) === null || _b === void 0 ? void 0 : _b.publicId) {
            yield cloud_1.default.uploader.destroy(conversation.avatar.publicId);
        }
        const { secure_url, public_id } = yield cloud_1.default.uploader.upload(avatar.filepath, { width: 400, height: 400, crop: "thumb" });
        conversation.avatar = { url: secure_url, publicId: public_id };
    }
    yield conversation.save();
    res.status(200).json({ conversation });
});
exports.updateConversation = updateConversation;
const deleteConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const userId = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(id))
        return res.status(422).json({ error: "Invalid conversation ID!" });
    const conversation = yield Conversation_1.default.findOne({
        _id: id,
        owner: userId,
    });
    if (!conversation)
        return res
            .status(404)
            .json({ error: "Conversation not found or unauthorized!" });
    if ((_a = conversation.avatar) === null || _a === void 0 ? void 0 : _a.publicId) {
        yield cloud_1.default.uploader.destroy(conversation.avatar.publicId);
    }
    yield Conversation_1.default.findByIdAndDelete(id);
    res.status(200).json({ message: "Conversation deleted!" });
});
exports.deleteConversation = deleteConversation;
const addMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { userId } = req.body;
    const requester = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(id) || !(0, mongoose_1.isValidObjectId)(userId))
        return res.status(422).json({ error: "Invalid IDs" });
    const conv = yield Conversation_1.default.findById(id);
    if (!conv)
        return res.status(404).json({ error: "Conversation not found" });
    const isAdmin = conv.members.some((m) => m.user.toString() === requester && m.role === "admin");
    if (!isAdmin && ((_a = conv.owner) === null || _a === void 0 ? void 0 : _a.toString()) !== requester)
        return res.status(403).json({ error: "Unauthorized" });
    if (conv.banned && conv.banned.some((b) => b.toString() === userId))
        return res.status(403).json({ error: "User is banned" });
    if (conv.members.some((m) => m.user.toString() === userId))
        return res.status(422).json({ error: "User already a member" });
    conv.members.push({ user: userId, role: "member" });
    yield conv.save();
    const io = req.app.get("io");
    io.to(id).emit("member-added", { conversationId: id, userId });
    res.status(200).json({ message: "Member added", conversation: conv });
});
exports.addMember = addMember;
const removeMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id, userId } = req.params;
    const requester = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(id) || !(0, mongoose_1.isValidObjectId)(userId))
        return res.status(422).json({ error: "Invalid IDs" });
    const conv = yield Conversation_1.default.findById(id);
    if (!conv)
        return res.status(404).json({ error: "Conversation not found" });
    const isAdmin = conv.members.some((m) => m.user.toString() === requester && m.role === "admin");
    if (!isAdmin && ((_a = conv.owner) === null || _a === void 0 ? void 0 : _a.toString()) !== requester)
        return res.status(403).json({ error: "Unauthorized" });
    if (!conv.members.some((m) => m.user.toString() === userId))
        return res.status(404).json({ error: "Member not found" });
    conv.members = conv.members.filter((m) => m.user.toString() !== userId);
    yield conv.save();
    const io = req.app.get("io");
    io.to(id).emit("member-removed", { conversationId: id, userId });
    res.status(200).json({ message: "Member removed", conversation: conv });
});
exports.removeMember = removeMember;
const promoteAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { userId } = req.body;
    const requester = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(id) || !(0, mongoose_1.isValidObjectId)(userId))
        return res.status(422).json({ error: "Invalid IDs" });
    const conv = yield Conversation_1.default.findById(id);
    if (!conv)
        return res.status(404).json({ error: "Conversation not found" });
    const isAdmin = conv.members.some((m) => m.user.toString() === requester && m.role === "admin");
    if (!isAdmin && ((_a = conv.owner) === null || _a === void 0 ? void 0 : _a.toString()) !== requester)
        return res.status(403).json({ error: "Unauthorized" });
    const member = conv.members.find((m) => m.user.toString() === userId);
    if (!member)
        return res.status(404).json({ error: "Member not found" });
    member.role = "admin";
    yield conv.save();
    const io = req.app.get("io");
    io.to(id).emit("role-changed", { conversationId: id, userId, role: "admin" });
    res.status(200).json({ message: "Promoted to admin", conversation: conv });
});
exports.promoteAdmin = promoteAdmin;
const demoteAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { userId } = req.body;
    const requester = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(id) || !(0, mongoose_1.isValidObjectId)(userId))
        return res.status(422).json({ error: "Invalid IDs" });
    const conv = yield Conversation_1.default.findById(id);
    if (!conv)
        return res.status(404).json({ error: "Conversation not found" });
    const isAdmin = conv.members.some((m) => m.user.toString() === requester && m.role === "admin");
    if (!isAdmin && ((_a = conv.owner) === null || _a === void 0 ? void 0 : _a.toString()) !== requester)
        return res.status(403).json({ error: "Unauthorized" });
    const member = conv.members.find((m) => m.user.toString() === userId);
    if (!member)
        return res.status(404).json({ error: "Member not found" });
    member.role = "member";
    yield conv.save();
    const io = req.app.get("io");
    io.to(id).emit("role-changed", {
        conversationId: id,
        userId,
        role: "member",
    });
    res.status(200).json({ message: "Demoted from admin", conversation: conv });
});
exports.demoteAdmin = demoteAdmin;
const banUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { userId } = req.body;
    const requester = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(id) || !(0, mongoose_1.isValidObjectId)(userId))
        return res.status(422).json({ error: "Invalid IDs" });
    const conv = yield Conversation_1.default.findById(id);
    if (!conv)
        return res.status(404).json({ error: "Conversation not found" });
    const isAdmin = conv.members.some((m) => m.user.toString() === requester && m.role === "admin");
    if (!isAdmin && ((_a = conv.owner) === null || _a === void 0 ? void 0 : _a.toString()) !== requester)
        return res.status(403).json({ error: "Unauthorized" });
    conv.members = conv.members.filter((m) => m.user.toString() !== userId);
    conv.banned = Array.from(new Set([...(conv.banned || []), userId]));
    yield conv.save();
    const io = req.app.get("io");
    io.to(id).emit("user-banned", { conversationId: id, userId });
    res.status(200).json({ message: "User banned", conversation: conv });
});
exports.banUser = banUser;
const unbanUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { userId } = req.body;
    const requester = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(id) || !(0, mongoose_1.isValidObjectId)(userId))
        return res.status(422).json({ error: "Invalid IDs" });
    const conv = yield Conversation_1.default.findById(id);
    if (!conv)
        return res.status(404).json({ error: "Conversation not found" });
    const isAdmin = conv.members.some((m) => m.user.toString() === requester && m.role === "admin");
    if (!isAdmin && ((_a = conv.owner) === null || _a === void 0 ? void 0 : _a.toString()) !== requester)
        return res.status(403).json({ error: "Unauthorized" });
    conv.banned = (conv.banned || []).filter((b) => b.toString() !== userId);
    yield conv.save();
    const io = req.app.get("io");
    io.to(id).emit("user-unbanned", { conversationId: id, userId });
    res.status(200).json({ message: "User unbanned", conversation: conv });
});
exports.unbanUser = unbanUser;
const toggleMute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { userId, mute } = req.body;
    const requester = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(id))
        return res.status(422).json({ error: "Invalid conversation ID" });
    const conv = yield Conversation_1.default.findById(id);
    if (!conv)
        return res.status(404).json({ error: "Conversation not found" });
    let target = requester;
    if (userId &&
        (((_a = conv.owner) === null || _a === void 0 ? void 0 : _a.toString()) === requester ||
            conv.members.some((m) => m.user.toString() === requester && m.role === "admin"))) {
        target = userId;
    }
    const member = conv.members.find((m) => m.user.toString() === target);
    if (!member)
        return res.status(404).json({ error: "Member not found" });
    member.is_muted = Boolean(mute);
    yield conv.save();
    const io = req.app.get("io");
    io.to(id).emit("mute-updated", {
        conversationId: id,
        userId: target,
        muted: member.is_muted,
    });
    res.status(200).json({ message: "Mute updated", conversation: conv });
});
exports.toggleMute = toggleMute;
const leaveGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const userId = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(id))
        return res.status(422).json({ error: "Invalid conversation ID" });
    const conv = yield Conversation_1.default.findById(id);
    if (!conv)
        return res.status(404).json({ error: "Conversation not found" });
    conv.members = conv.members.filter((m) => m.user.toString() !== userId);
    if (((_a = conv.owner) === null || _a === void 0 ? void 0 : _a.toString()) === userId) {
        const newOwner = conv.members.find((m) => m.role === "admin") || conv.members[0];
        if (newOwner)
            conv.owner = newOwner.user;
        else {
            if ((_b = conv.avatar) === null || _b === void 0 ? void 0 : _b.publicId)
                yield cloud_1.default.uploader.destroy(conv.avatar.publicId);
            yield Conversation_1.default.findByIdAndDelete(id);
            const io = req.app.get("io");
            io.to(id).emit("group-deleted", { conversationId: id });
            return res.status(200).json({ message: "Left and deleted group" });
        }
    }
    yield conv.save();
    const io = req.app.get("io");
    io.to(id).emit("member-left", { conversationId: id, userId });
    res.status(200).json({ message: "Left group", conversation: conv });
});
exports.leaveGroup = leaveGroup;
const kickUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { userId } = req.body;
    const requester = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(id) || !(0, mongoose_1.isValidObjectId)(userId))
        return res.status(422).json({ error: "Invalid IDs" });
    const conv = yield Conversation_1.default.findById(id);
    if (!conv)
        return res.status(404).json({ error: "Conversation not found" });
    const isAdmin = conv.members.some((m) => m.user.toString() === requester && m.role === "admin");
    if (!isAdmin && ((_a = conv.owner) === null || _a === void 0 ? void 0 : _a.toString()) !== requester)
        return res.status(403).json({ error: "Unauthorized" });
    conv.members = conv.members.filter((m) => m.user.toString() !== userId);
    yield conv.save();
    const io = req.app.get("io");
    io.to(id).emit("user-kicked", { conversationId: id, userId });
    res.status(200).json({ message: "User kicked", conversation: conv });
});
exports.kickUser = kickUser;
