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
exports.search = void 0;
const User_1 = __importDefault(require("../models/User"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Friendship_1 = __importDefault(require("../models/Friendship"));
const search = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { q } = req.query;
    const userId = req.user.id;
    if (!q || typeof q !== "string" || q.trim().length === 0) {
        return res.status(200).json({ conversations: [], users: [] });
    }
    const keyword = q.trim();
    const regex = new RegExp(keyword, "i");
    const [conversations, users] = yield Promise.all([
        Conversation_1.default.find({
            "members.user": userId,
            $or: [{ name: regex }, { type: "private" }],
        })
            .populate("members.user", "username name avatar is_online last_seen show_online_status")
            .populate("lastMessage")
            .sort({ updatedAt: -1 })
            .limit(20),
        User_1.default.find({
            _id: { $ne: userId },
            $or: [{ name: regex }, { username: regex }],
        })
            .select("username name avatar is_online last_seen show_online_status bio")
            .limit(15),
    ]);
    const filteredConversations = conversations.filter((conv) => {
        var _a;
        if (conv.type === "group")
            return regex.test(conv.name || "");
        const other = (_a = conv.members.find((m) => m.user._id.toString() !== userId.toString())) === null || _a === void 0 ? void 0 : _a.user;
        if (!other)
            return false;
        return regex.test(other.name || "") || regex.test(other.username || "");
    });
    const convWithNickname = yield Promise.all(filteredConversations.map((conv) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        if (conv.type === "private") {
            const other = (_a = conv.members.find((m) => m.user._id.toString() !== userId.toString())) === null || _a === void 0 ? void 0 : _a.user;
            if (other) {
                const friendship = yield Friendship_1.default.findOne({
                    $or: [
                        { requester: userId, receiver: other._id },
                        { requester: other._id, receiver: userId },
                    ],
                });
                if (friendship === null || friendship === void 0 ? void 0 : friendship.nickname)
                    other.nickname = friendship.nickname;
            }
        }
        return conv;
    })));
    const blockedByMe = yield Friendship_1.default.find({
        requester: userId,
        status: "blocked",
    }).select("receiver");
    const blockedSet = new Set(blockedByMe.map((f) => f.receiver.toString()));
    const filteredUsers = users.filter((u) => !blockedSet.has(u._id.toString()));
    res.status(200).json({
        conversations: convWithNickname,
        users: filteredUsers,
    });
});
exports.search = search;
