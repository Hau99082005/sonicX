import { Router } from "express";
import { mustAuth } from "#/middleware/auth";
import {
  acceptFriendRequest,
  blockUser,
  getFriends,
  rejectFriendRequest,
  sendFriendRequest,
  unfriend,
  cancelFriendRequest,
  getFriendshipStatus,
  unblockUser,
  updateNickname,
} from "#/controllers/friendship";

const router = Router();

router.post("/request", mustAuth, sendFriendRequest);
router.post("/cancel", mustAuth, cancelFriendRequest);
router.post("/accept", mustAuth, acceptFriendRequest);
router.post("/reject", mustAuth, rejectFriendRequest);
router.get("/status/:targetId", mustAuth, getFriendshipStatus);
router.get("/all", mustAuth, getFriends);
router.delete("/unfriend/:friendId", mustAuth, unfriend);
router.post("/block", mustAuth, blockUser);
router.post("/unblock", mustAuth, unblockUser);
router.post("/nickname", mustAuth, updateNickname);

export default router;
