import { RequestHandler } from "express";
import Friendship from "#/models/Friendship";
import User from "#/models/User";
import { isValidObjectId } from "mongoose";

export const sendFriendRequest: RequestHandler = async (req, res) => {
  const { receiverId } = req.body;
  const requesterId = req.user.id;

  if (!isValidObjectId(receiverId))
    return res.status(422).json({ error: "Invalid receiver ID!" });

  if (requesterId === receiverId)
    return res.status(422).json({ error: "You cannot add yourself!" });

  const receiver = await User.findById(receiverId);
  if (!receiver) return res.status(404).json({ error: "User not found!" });

  const existingFriendship = await Friendship.findOne({
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
      } else {
        existingFriendship.status = "accepted";
        await existingFriendship.save();
        return res
          .status(200)
          .json({ message: "Đã chấp nhận lời mời kết bạn!" });
      }
    }
    return res.status(422).json({ error: "Hai người đã là bạn bè!" });
  }

  await Friendship.create({
    requester: requesterId,
    receiver: receiverId,
    status: "pending",
  });

  res.status(201).json({ message: "Friend request sent!" });
};

export const cancelFriendRequest: RequestHandler = async (req, res) => {
  const { receiverId } = req.body;
  const requesterId = req.user.id;

  const friendship = await Friendship.findOneAndDelete({
    requester: requesterId,
    receiver: receiverId,
    status: "pending",
  });

  if (!friendship)
    return res.status(404).json({ error: "Friend request not found!" });

  res.status(200).json({ message: "Friend request cancelled!" });
};

export const unblockUser: RequestHandler = async (req, res) => {
  const { userId: targetId } = req.body;
  const userId = req.user.id;

  const friendship = await Friendship.findOneAndDelete({
    requester: userId,
    receiver: targetId,
    status: "blocked",
  });

  if (!friendship)
    return res.status(404).json({ error: "User is not blocked!" });

  res.status(200).json({ message: "User unblocked!" });
};

export const getFriendshipStatus: RequestHandler = async (req, res) => {
  const { targetId } = req.params;
  const userId = req.user.id;

  const friendship = await Friendship.findOne({
    $or: [
      { requester: userId, receiver: targetId },
      { requester: targetId, receiver: userId },
    ],
  });

  res.status(200).json({
    status: friendship ? friendship.status : "none",
    requester: friendship?.requester,
  });
};

export const acceptFriendRequest: RequestHandler = async (req, res) => {
  const { requesterId } = req.body;
  const receiverId = req.user.id;

  const friendship = await Friendship.findOne({
    requester: requesterId,
    receiver: receiverId,
    status: "pending",
  });

  if (!friendship)
    return res.status(404).json({ error: "Không tìm thấy lời mời kết bạn!" });

  friendship.status = "accepted";
  await friendship.save();

  res.status(200).json({ message: "Đã chấp nhận lời mời!" });
};

export const rejectFriendRequest: RequestHandler = async (req, res) => {
  const { requesterId } = req.body;
  const receiverId = req.user.id;

  const friendship = await Friendship.findOneAndDelete({
    requester: requesterId,
    receiver: receiverId,
    status: "pending",
  });

  if (!friendship)
    return res.status(404).json({ error: "Không tìm thấy lời mời kết bạn!" });

  res.status(200).json({ message: "Đã từ chối lời mời!" });
};

export const getFriends: RequestHandler = async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  const query: any = {
    $or: [{ requester: userId }, { receiver: userId }],
    status: status || "accepted",
  };

  const friendships = await Friendship.find(query).populate(
    "requester receiver",
    "username name avatar is_online last_seen",
  );

  const results = friendships.map((f: any) => {
    const isRequester = f.requester._id.toString() === userId.toString();
    const otherUser = isRequester ? f.receiver : f.requester;
    return {
      ...otherUser.toObject(),
      nickname: f.nickname,
      friendshipId: f._id,
      status: f.status,
      isRequester,
    };
  });

  res.status(200).json({ friends: results });
};

export const unfriend: RequestHandler = async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.id;

  const friendship = await Friendship.findOneAndDelete({
    $or: [
      { requester: userId, receiver: friendId },
      { requester: friendId, receiver: userId },
    ],
    status: "accepted",
  });

  if (!friendship)
    return res.status(404).json({ error: "Friendship not found!" });

  res.status(200).json({ message: "Unfriended successfully!" });
};

export const blockUser: RequestHandler = async (req, res) => {
  const { userId: targetId } = req.body;
  const userId = req.user.id;

  const friendship = await Friendship.findOneAndUpdate(
    {
      $or: [
        { requester: userId, receiver: targetId },
        { requester: targetId, receiver: userId },
      ],
    },
    { requester: userId, receiver: targetId, status: "blocked" },
    { upsert: true, returnDocument: "after" },
  );

  res.status(200).json({ message: "User blocked!" });
};

export const updateNickname: RequestHandler = async (req, res) => {
  const { friendId, nickname } = req.body;
  const userId = req.user.id;

  if (!isValidObjectId(friendId))
    return res.status(422).json({ error: "Invalid friend ID!" });

  const friendship = await Friendship.findOneAndUpdate(
    {
      $or: [
        { requester: userId, receiver: friendId },
        { requester: friendId, receiver: userId },
      ],
    },
    { nickname: nickname || null },
    { returnDocument: "after" },
  );

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
};
