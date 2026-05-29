import { Router } from "express";
import { mustAuth } from "#/middleware/auth";
import {
  acceptFriendRequest,
  blockUser,
  getFriends,
  rejectFriendRequest,
  sendFriendRequest,
  unfriend,
} from "#/controllers/friendship";

const router = Router();

router.post("/request", mustAuth, sendFriendRequest);
router.post("/accept", mustAuth, acceptFriendRequest);
router.post("/reject", mustAuth, rejectFriendRequest);
router.get("/all", mustAuth, getFriends);
router.delete("/:friendId", mustAuth, unfriend);
router.patch("/block", mustAuth, blockUser);

export default router;
