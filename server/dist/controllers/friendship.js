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
exports.updateNickname = exports.getBlockedByMe = exports.blockUser = exports.unfriend = exports.getFriends = exports.rejectFriendRequest = exports.acceptFriendRequest = exports.getBlockStatus = exports.getFriendshipStatus = exports.unblockUser = exports.cancelFriendRequest = exports.sendFriendRequest = void 0;
const Friendship_1 = __importDefault(require("../models/Friendship"));
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = require("mongoose");
const sendFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { receiverId } = req.body;
    const requesterId = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(receiverId))
        return res.status(422).json({ error: "Invalid receiver ID!" });
    if (requesterId === receiverId)
        return res.status(422).json({ error: "You cannot add yourself!" });
    const receiver = yield User_1.default.findById(receiverId);
    if (!receiver)
        return res.status(404).json({ error: "User not found!" });
    const existingFriendship = yield Friendship_1.default.findOne({
        $or: [
            { requester: requesterId, receiver: receiverId },
            { requester: receiverId, receiver: requesterId },
        ],
    });
    if (existingFriendship) {
        if (existingFriendship.status === "blocked") {
            return res.status(403).json({ error: "Người dùng này đã bị chặn!" });
        }
        if (existingFriendship.status === "pending") {
            if (existingFriendship.requester.toString() === requesterId) {
                return res
                    .status(422)
                    .json({ error: "Bạn đã gửi lời mời kết bạn rồi!" });
            }
            else {
                existingFriendship.status = "accepted";
                yield existingFriendship.save();
                return res
                    .status(200)
                    .json({ message: "Đã chấp nhận lời mời kết bạn!" });
            }
        }
        return res.status(422).json({ error: "Hai người đã là bạn bè!" });
    }
    yield Friendship_1.default.create({
        requester: requesterId,
        receiver: receiverId,
        status: "pending",
    });
    res.status(201).json({ message: "Friend request sent!" });
});
exports.sendFriendRequest = sendFriendRequest;
const cancelFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { receiverId } = req.body;
    const requesterId = req.user.id;
    const friendship = yield Friendship_1.default.findOneAndDelete({
        requester: requesterId,
        receiver: receiverId,
        status: "pending",
    });
    if (!friendship)
        return res.status(404).json({ error: "Friend request not found!" });
    res.status(200).json({ message: "Friend request cancelled!" });
});
exports.cancelFriendRequest = cancelFriendRequest;
const unblockUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId: targetId } = req.body;
    const userId = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(targetId))
        return res.status(422).json({ error: "Invalid user ID!" });
    const friendship = yield Friendship_1.default.findOneAndDelete({
        requester: userId,
        receiver: targetId,
        status: "blocked",
    });
    if (!friendship)
        return res.status(404).json({ error: "Người dùng chưa bị chặn!" });
    const io = req.app.get("io");
    if (io) {
        io.to(targetId.toString()).emit("user-unblocked", {
            unblockedBy: userId,
            targetId: targetId.toString(),
        });
        io.to(userId.toString()).emit("user-unblocked", {
            unblockedBy: userId,
            targetId: targetId.toString(),
        });
    }
    res.status(200).json({ message: "Đã bỏ chặn người dùng!" });
});
exports.unblockUser = unblockUser;
const getFriendshipStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { targetId } = req.params;
    const userId = req.user.id;
    const friendship = yield Friendship_1.default.findOne({
        $or: [
            { requester: userId, receiver: targetId },
            { requester: targetId, receiver: userId },
        ],
    });
    res.status(200).json({
        status: friendship ? friendship.status : "none",
        requester: friendship === null || friendship === void 0 ? void 0 : friendship.requester,
    });
});
exports.getFriendshipStatus = getFriendshipStatus;
const getBlockStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { targetId } = req.params;
    const userId = req.user.id;
    const iBlockedThem = yield Friendship_1.default.findOne({
        requester: userId,
        receiver: targetId,
        status: "blocked",
    });
    const theyBlockedMe = yield Friendship_1.default.findOne({
        requester: targetId,
        receiver: userId,
        status: "blocked",
    });
    res.status(200).json({
        iBlockedThem: !!iBlockedThem,
        theyBlockedMe: !!theyBlockedMe,
    });
});
exports.getBlockStatus = getBlockStatus;
const acceptFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { requesterId } = req.body;
    const receiverId = req.user.id;
    const friendship = yield Friendship_1.default.findOne({
        requester: requesterId,
        receiver: receiverId,
        status: "pending",
    });
    if (!friendship)
        return res.status(404).json({ error: "Không tìm thấy lời mời kết bạn!" });
    friendship.status = "accepted";
    yield friendship.save();
    res.status(200).json({ message: "Đã chấp nhận lời mời!" });
});
exports.acceptFriendRequest = acceptFriendRequest;
const rejectFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { requesterId } = req.body;
    const receiverId = req.user.id;
    const friendship = yield Friendship_1.default.findOneAndDelete({
        requester: requesterId,
        receiver: receiverId,
        status: "pending",
    });
    if (!friendship)
        return res.status(404).json({ error: "Không tìm thấy lời mời kết bạn!" });
    res.status(200).json({ message: "Đã từ chối lời mời!" });
});
exports.rejectFriendRequest = rejectFriendRequest;
const getFriends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { status } = req.query;
    const query = {
        $or: [{ requester: userId }, { receiver: userId }],
        status: status || "accepted",
    };
    const friendships = yield Friendship_1.default.find(query).populate("requester receiver", "username name avatar is_online last_seen");
    const results = friendships.map((f) => {
        const isRequester = f.requester._id.toString() === userId.toString();
        const otherUser = isRequester ? f.receiver : f.requester;
        return Object.assign(Object.assign({}, otherUser.toObject()), { nickname: f.nickname, friendshipId: f._id, status: f.status, isRequester });
    });
    res.status(200).json({ friends: results });
});
exports.getFriends = getFriends;
const unfriend = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { friendId } = req.params;
    const userId = req.user.id;
    const friendship = yield Friendship_1.default.findOneAndDelete({
        $or: [
            { requester: userId, receiver: friendId },
            { requester: friendId, receiver: userId },
        ],
        status: "accepted",
    });
    if (!friendship)
        return res.status(404).json({ error: "Friendship not found!" });
    res.status(200).json({ message: "Unfriended successfully!" });
});
exports.unfriend = unfriend;
const blockUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId: targetId } = req.body;
    const userId = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(targetId))
        return res.status(422).json({ error: "Invalid user ID!" });
    if (userId.toString() === targetId)
        return res.status(422).json({ error: "Không thể chặn chính mình!" });
    yield Friendship_1.default.findOneAndUpdate({
        $or: [
            { requester: userId, receiver: targetId },
            { requester: targetId, receiver: userId },
        ],
    }, { requester: userId, receiver: targetId, status: "blocked" }, { upsert: true, returnDocument: "after" });
    const io = req.app.get("io");
    if (io) {
        io.to(targetId.toString()).emit("user-blocked", {
            blockedBy: userId,
            targetId: targetId.toString(),
        });
        io.to(userId.toString()).emit("user-blocked", {
            blockedBy: userId,
            targetId: targetId.toString(),
        });
    }
    res.status(200).json({ message: "Đã chặn người dùng!" });
});
exports.blockUser = blockUser;
const getBlockedByMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const friendships = yield Friendship_1.default.find({
        requester: userId,
        status: "blocked",
    }).populate("receiver", "username name avatar");
    const results = friendships.map((f) => (Object.assign(Object.assign({}, f.receiver.toObject()), { friendshipId: f._id })));
    res.status(200).json({ blocked: results });
});
exports.getBlockedByMe = getBlockedByMe;
const updateNickname = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { friendId, nickname } = req.body;
    const userId = req.user.id;
    if (!(0, mongoose_1.isValidObjectId)(friendId))
        return res.status(422).json({ error: "Invalid friend ID!" });
    const friendship = yield Friendship_1.default.findOneAndUpdate({
        $or: [
            { requester: userId, receiver: friendId },
            { requester: friendId, receiver: userId },
        ],
    }, { nickname: nickname || null }, { returnDocument: "after" });
    if (!friendship)
        return res.status(404).json({ error: "Friendship not found!" });
    const io = req.app.get("io");
    if (io)
        io.to(friendId)
            .to(userId)
            .emit("nickname-updated", {
            userId,
            friendId,
            nickname: friendship.nickname,
        });
    res.status(200).json({ message: "Nickname updated!", friendship });
});
exports.updateNickname = updateNickname;
