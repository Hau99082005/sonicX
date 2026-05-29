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
    return res.status(422).json({ error: "Friendship already exists!" });
  }

  await Friendship.create({
    requester: requesterId,
    receiver: receiverId,
    status: "pending",
  });

  res.status(201).json({ message: "Friend request sent!" });
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
    return res.status(404).json({ error: "Friend request not found!" });

  friendship.status = "accepted";
  await friendship.save();

  res.status(200).json({ message: "Friend request accepted!" });
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
    return res.status(404).json({ error: "Friend request not found!" });

  res.status(200).json({ message: "Friend request rejected!" });
};

export const getFriends: RequestHandler = async (req, res) => {
  const userId = req.user.id;

  const friendships = await Friendship.find({
    $or: [{ requester: userId }, { receiver: userId }],
    status: "accepted",
  }).populate("requester receiver", "username avatar is_online last_seen");

  const friends = friendships.map((f) => {
    return f.requester._id.toString() === userId ? f.receiver : f.requester;
  });

  res.status(200).json({ friends });
};

export const unfriend: RequestHandler = async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.id;

  if (!isValidObjectId(friendId))
    return res.status(422).json({ error: "Invalid friend ID!" });

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

  if (!isValidObjectId(targetId))
    return res.status(422).json({ error: "Invalid user ID!" });

  const friendship = await Friendship.findOneAndUpdate(
    {
      $or: [
        { requester: userId, receiver: targetId },
        { requester: targetId, receiver: userId },
      ],
    },
    { requester: userId, receiver: targetId, status: "blocked" },
    { upsert: true, new: true }
  );

  res.status(200).json({ message: "User blocked!" });
};
