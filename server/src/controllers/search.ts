import { RequestHandler } from "express";
import User from "#/models/User";
import Conversation from "#/models/Conversation";
import Friendship from "#/models/Friendship";

export const search: RequestHandler = async (req, res) => {
  const { q } = req.query;
  const userId = req.user.id;

  if (!q || typeof q !== "string" || q.trim().length === 0) {
    return res.status(200).json({ conversations: [], users: [] });
  }

  const keyword = q.trim();
  const regex = new RegExp(keyword, "i");

  const [conversations, users] = await Promise.all([
    Conversation.find({
      "members.user": userId,
      $or: [{ name: regex }, { type: "private" }],
    })
      .populate("members.user", "username name avatar is_online last_seen show_online_status")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .limit(20),

    User.find({
      _id: { $ne: userId },
      $or: [{ name: regex }, { username: regex }],
    })
      .select("username name avatar is_online last_seen show_online_status bio")
      .limit(15),
  ]);

  const filteredConversations = conversations.filter((conv) => {
    if (conv.type === "group") return regex.test(conv.name || "");
    const other = conv.members.find(
      (m: any) => m.user._id.toString() !== userId.toString(),
    )?.user as any;
    if (!other) return false;
    return regex.test(other.name || "") || regex.test(other.username || "");
  });

  const convWithNickname = await Promise.all(
    filteredConversations.map(async (conv) => {
      if (conv.type === "private") {
        const other = conv.members.find(
          (m: any) => m.user._id.toString() !== userId.toString(),
        )?.user as any;
        if (other) {
          const friendship = await Friendship.findOne({
            $or: [
              { requester: userId, receiver: other._id },
              { requester: other._id, receiver: userId },
            ],
          });
          if (friendship?.nickname) (other as any).nickname = friendship.nickname;
        }
      }
      return conv;
    }),
  );

  const blockedByMe = await Friendship.find({
    requester: userId,
    status: "blocked",
  }).select("receiver");
  const blockedSet = new Set(blockedByMe.map((f) => f.receiver.toString()));

  const filteredUsers = users.filter((u) => !blockedSet.has(u._id.toString()));

  res.status(200).json({
    conversations: convWithNickname,
    users: filteredUsers,
  });
};
