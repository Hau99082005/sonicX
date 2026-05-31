import { Router } from "express";
import { mustAuth } from "#/middleware/auth";
import {
  createConversation,
  deleteConversation,
  getConversationById,
  getConversations,
  updateConversation,
  addMember,
  removeMember,
  promoteAdmin,
  demoteAdmin,
  banUser,
  unbanUser,
  toggleMute,
  leaveGroup,
  kickUser,
} from "#/controllers/conversation";
import fileParser from "#/middleware/fileParser";

const router = Router();

router.post("/create", mustAuth, fileParser, createConversation);
router.get("/all", mustAuth, getConversations);
router.get("/:id", mustAuth, getConversationById);
router.patch("/:id", mustAuth, fileParser, updateConversation);
router.delete("/:id", mustAuth, deleteConversation);

router.post("/:id/member", mustAuth, addMember);
router.delete("/:id/member/:userId", mustAuth, removeMember);
router.post("/:id/promote", mustAuth, promoteAdmin);
router.post("/:id/demote", mustAuth, demoteAdmin);
router.post("/:id/ban", mustAuth, banUser);
router.post("/:id/unban", mustAuth, unbanUser);
router.post("/:id/mute", mustAuth, toggleMute);
router.post("/:id/leave", mustAuth, leaveGroup);
router.post("/:id/kick", mustAuth, kickUser);

export default router;
